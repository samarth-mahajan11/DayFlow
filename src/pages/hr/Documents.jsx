
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Documents.css'

function Documents() {
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [documents, setDocuments] = useState([])

  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [viewing, setViewing] = useState(null)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [employeeDropdownOpen, setEmployeeDropdownOpen] =
    useState(false)

  const selectedEmployeeData = employees.find(
    (employee) => employee.id === selectedEmployee
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      navigate('/login')
      return
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (profile.role !== 'hr') {
      setError('Access denied. HR access is required.')
      setLoading(false)
      return
    }

    const [
      { data: employeeData, error: employeeError },
      { data: documentData, error: documentError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, employee_id, full_name, email, department'
        )
        .eq('role', 'employee')
        .order('full_name', {
          ascending: true,
        }),

      supabase
        .from('documents')
        .select(`
          id,
          employee_id,
          document_name,
          document_type,
          file_url,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        }),
    ])

    if (employeeError) {
      setError(employeeError.message)
      setLoading(false)
      return
    }

    if (documentError) {
      setError(documentError.message)
      setLoading(false)
      return
    }

    setEmployees(employeeData || [])
    setDocuments(documentData || [])

    setLoading(false)
  }

  const getEmployee = (employeeId) => {
    return employees.find(
      (employee) => employee.id === employeeId
    )
  }

  /*
    Converts either:

    1. A new stored Storage path:
       employee-uuid/123456_file.pdf

    OR

    2. An old public URL:
       https://project.supabase.co/storage/v1/object/public/documents/employee-uuid/file.pdf

    into the Storage path required by createSignedUrl().
  */
  const getStoragePath = (fileUrlOrPath) => {
    if (!fileUrlOrPath) {
      return null
    }

    const publicMarker =
      '/storage/v1/object/public/documents/'

    const signedMarker =
      '/storage/v1/object/sign/documents/'

    if (fileUrlOrPath.includes(publicMarker)) {
      const path = fileUrlOrPath.split(
        publicMarker
      )[1]

      if (!path) {
        return null
      }

      return decodeURIComponent(path)
    }

    if (fileUrlOrPath.includes(signedMarker)) {
      const path = fileUrlOrPath.split(
        signedMarker
      )[1]

      if (!path) {
        return null
      }

      return decodeURIComponent(
        path.split('?')[0]
      )
    }

    /*
      New records store the Storage path directly.
    */
    return fileUrlOrPath
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!selectedEmployee) {
      setError('Please select an employee.')
      return
    }

    if (!documentType.trim()) {
      setError('Please enter a document type.')
      return
    }

    if (!selectedFile) {
      setError('Please select a file.')
      return
    }

    setUploading(true)

    try {
      const safeFileName =
        selectedFile.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')

      const filePath =
        `${selectedEmployee}/${Date.now()}_${safeFileName}`

      /*
        Upload the actual file to the private
        "documents" Storage bucket.
      */
      const {
        error: uploadError,
      } = await supabase.storage
        .from('documents')
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl: '3600',
            upsert: false,
          }
        )

      if (uploadError) {
        throw uploadError
      }

      /*
        IMPORTANT:

        Do NOT use getPublicUrl() here.

        The bucket is private, so we store only
        the Storage path in file_url.

        Example:
        employee-uuid/123456_document.pdf
      */
      const { error: insertError } =
        await supabase
          .from('documents')
          .insert({
            employee_id: selectedEmployee,
            document_name: selectedFile.name,
            document_type: documentType.trim(),
            file_url: filePath,
          })

      if (insertError) {
        /*
          If the database insert fails, remove
          the uploaded file so we don't leave
          an orphaned Storage object.
        */
        await supabase.storage
          .from('documents')
          .remove([filePath])

        throw insertError
      }

      setMessage(
        'Employee document uploaded successfully.'
      )

      setSelectedEmployee('')
      setDocumentType('')
      setSelectedFile(null)

      const fileInput =
        document.getElementById(
          'document-file'
        )

      if (fileInput) {
        fileInput.value = ''
      }

      await loadData()
    } catch (err) {
      console.error(
        'DOCUMENT UPLOAD ERROR:',
        err
      )

      setError(
        err.message ||
          'Unable to upload employee document.'
      )
    } finally {
      setUploading(false)
    }
  }

  /*
    Opens a private document using a temporary
    signed URL.

    The signed URL is valid for 1 hour.
  */
  const handleView = async (document) => {
    setError('')
    setMessage('')
    setViewing(document.id)

    try {
      const storagePath =
        getStoragePath(document.file_url)

      if (!storagePath) {
        throw new Error(
          'Unable to determine the document file path.'
        )
      }

      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from('documents')
        .createSignedUrl(
          storagePath,
          60 * 60
        )

      if (signedUrlError) {
        throw signedUrlError
      }

      if (!data?.signedUrl) {
        throw new Error(
          'Unable to create a secure document URL.'
        )
      }

      /*
        Open the private document in a new tab.
      */
      window.open(
        data.signedUrl,
        '_blank',
        'noopener,noreferrer'
      )
    } catch (err) {
      console.error(
        'DOCUMENT VIEW ERROR:',
        err
      )

      setError(
        err.message ||
          'Unable to open this document.'
      )
    } finally {
      setViewing(null)
    }
  }

  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `Delete "${document.document_name}"?`
    )

    if (!confirmed) {
      return
    }

    setDeleting(document.id)
    setError('')
    setMessage('')

    try {
      const storagePath =
        getStoragePath(document.file_url)

      /*
        Delete the actual file from Storage.
      */
      if (storagePath) {
        const {
          error: storageError,
        } = await supabase.storage
          .from('documents')
          .remove([storagePath])

        if (storageError) {
          console.error(
            'STORAGE DELETE ERROR:',
            storageError
          )

          /*
            We continue because the database
            record should still be removable.
          */
        }
      }

      /*
        Delete the document database record.
      */
      const {
        error: deleteError,
      } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)

      if (deleteError) {
        throw deleteError
      }

      setMessage(
        'Employee document deleted successfully.'
      )

      await loadData()
    } catch (err) {
      console.error(
        'DOCUMENT DELETE ERROR:',
        err
      )

      setError(
        err.message ||
          'Unable to delete employee document.'
      )
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (value) => {
    if (!value) {
      return '--'
    }

    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  if (loading) {
    return (
      <div className="documents-loading">
        <div className="documents-loading-icon">
          ◌
        </div>

        <h2>Loading documents</h2>

        <p>
          Preparing employee documents...
        </p>
      </div>
    )
  }

  return (
    <div className="documents-page">
      <header className="documents-header">
        <div>
          <span className="documents-eyebrow">
            HR MANAGEMENT
          </span>

          <h1>Documents</h1>

          <p>
            Manage employee documents securely
            in one place.
          </p>
        </div>

        <button
          type="button"
          className="documents-back-button"
          onClick={() =>
            navigate('/hr/dashboard')
          }
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="documents-content">
        {error && (
          <div className="documents-message error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {message && (
          <div className="documents-message success">
            {message}
          </div>
        )}

        <section className="document-upload-card">
          <div className="document-section-heading">
            <div>
              <span>UPLOAD</span>

              <h2>Add Employee Document</h2>

              <p>
                Upload documents such as ID proof,
                certificates, contracts or other
                employee records.
              </p>
            </div>
          </div>

          <form
            className="document-upload-form"
            onSubmit={handleUpload}
          >
            <div className="document-form-group">
              <label htmlFor="employee">
                Employee
              </label>

              <div className="documents-custom-select">
                <button
                  type="button"
                  className={`documents-select-trigger ${
                    employeeDropdownOpen
                      ? 'open'
                      : ''
                  }`}
                  onClick={() =>
                    setEmployeeDropdownOpen(
                      !employeeDropdownOpen
                    )
                  }
                >
                  <span>
                    {selectedEmployeeData
                      ? `${selectedEmployeeData.employee_id} - ${selectedEmployeeData.full_name}`
                      : 'Select employee'}
                  </span>

                  <span className="documents-select-arrow">
                    {employeeDropdownOpen
                      ? '▲'
                      : '▼'}
                  </span>
                </button>

                {employeeDropdownOpen && (
                  <div className="documents-select-menu">
                    <button
                      type="button"
                      className="documents-select-option placeholder"
                      onClick={() => {
                        setSelectedEmployee('')
                        setEmployeeDropdownOpen(false)
                      }}
                    >
                      Select employee
                    </button>

                    {employees.map((employee) => (
                      <button
                        type="button"
                        key={employee.id}
                        className={`documents-select-option ${
                          selectedEmployee ===
                          employee.id
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedEmployee(
                            employee.id
                          )
                          setEmployeeDropdownOpen(
                            false
                          )
                        }}
                      >
                        <span className="documents-option-avatar">
                          {employee.full_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            '?'}
                        </span>

                        <span className="documents-option-info">
                          <strong>
                            {employee.full_name}
                          </strong>

                          <small>
                            {employee.employee_id}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="document-form-group">
              <label htmlFor="document-type">
                Document Type
              </label>

              <input
                id="document-type"
                type="text"
                value={documentType}
                onChange={(event) =>
                  setDocumentType(
                    event.target.value
                  )
                }
                placeholder="e.g. ID Proof, Contract, Certificate"
              />
            </div>

            <div className="document-form-group">
              <label htmlFor="document-file">
                File
              </label>

              <input
                id="document-file"
                type="file"
                onChange={(event) =>
                  setSelectedFile(
                    event.target.files?.[0] ||
                      null
                  )
                }
              />
            </div>

            <button
              type="submit"
              className="document-upload-button"
              disabled={uploading}
            >
              {uploading
                ? 'Uploading...'
                : 'Upload Document'}
            </button>
          </form>
        </section>

        <section className="documents-list-card">
          <div className="document-section-heading">
            <div>
              <span>DOCUMENT LIBRARY</span>

              <h2>Employee Documents</h2>

              <p>
                View and manage uploaded employee
                documents.
              </p>
            </div>

            <div className="document-count">
              {documents.length} Documents
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="documents-empty">
              <div className="empty-document-icon">
                📄
              </div>

              <h3>No documents yet</h3>

              <p>
                Uploaded employee documents will
                appear here.
              </p>
            </div>
          ) : (
            <div className="documents-table-wrapper">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Uploaded</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((document) => {
                    const employee =
                      getEmployee(
                        document.employee_id
                      )

                    return (
                      <tr key={document.id}>
                        <td>
                          <div className="document-employee">
                            <div className="document-avatar">
                              {employee?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                '?'}
                            </div>

                            <div>
                              <strong>
                                {employee?.full_name ||
                                  'Unknown'}
                              </strong>

                              <span>
                                {employee?.employee_id ||
                                  '--'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="document-name">
                            {document.document_name}
                          </span>
                        </td>

                        <td>
                          <span className="document-type-badge">
                            {document.document_type}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            document.created_at
                          )}
                        </td>

                        <td>
                          <div className="document-actions">
                            <button
                              type="button"
                              className="view-document"
                              disabled={
                                viewing ===
                                document.id
                              }
                              onClick={() =>
                                handleView(
                                  document
                                )
                              }
                            >
                              {viewing ===
                              document.id
                                ? 'Opening...'
                                : 'View'}
                            </button>

                            <button
                              type="button"
                              className="delete-document"
                              disabled={
                                deleting ===
                                document.id
                              }
                              onClick={() =>
                                handleDelete(
                                  document
                                )
                              }
                            >
                              {deleting ===
                              document.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Documents
