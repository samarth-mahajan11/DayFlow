
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Documents.css'

function formatDate(dateString) {
  if (!dateString) {
    return '--'
  }

  return new Date(dateString).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}

function getDocumentIcon(type) {
  if (type === 'Aadhaar') return 'ID'
  if (type === 'PAN') return 'PN'
  if (type === 'Resume') return 'CV'
  if (type === 'Certificate') return 'CT'
  if (type === 'Offer Letter') return 'OL'

  return 'DOC'
}

function Documents() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [documents, setDocuments] = useState([])

  const [file, setFile] = useState(null)
  const [documentName, setDocumentName] = useState('')
  const [documentType, setDocumentType] = useState('Other')
  const [documentTypeOpen, setDocumentTypeOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
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

    setUser(user)

    const {
      data,
      error: documentsError,
    } = await supabase
      .from('documents')
      .select(`
        id,
        employee_id,
        document_name,
        document_type,
        file_url,
        uploaded_by,
        created_at
      `)
      .eq('employee_id', user.id)
      .order('created_at', {
        ascending: false,
      })

    if (documentsError) {
      console.error(
        'DOCUMENTS LOAD ERROR:',
        documentsError
      )

      setError(documentsError.message)
      setLoading(false)
      return
    }

    setDocuments(data || [])
    setLoading(false)
  }

  const handleUpload = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!file) {
      setError('Please select a file.')
      return
    }

    if (!documentName.trim()) {
      setError('Please enter a document name.')
      return
    }

    if (!user) {
      setError('User session not available.')
      return
    }

    setUploading(true)

    try {
      const fileExtension = file.name.includes('.')
        ? file.name.split('.').pop().toLowerCase()
        : ''

      const safeName = documentName
        .trim()
        .replace(/[^a-zA-Z0-9-_]/g, '_')

      const timestamp = Date.now()

      const fileName = fileExtension
        ? `${safeName}-${timestamp}.${fileExtension}`
        : `${safeName}-${timestamp}`

      const filePath = `${user.id}/${fileName}`

      const {
        error: uploadError,
      } = await supabase.storage
        .from('documents')
        .upload(
          filePath,
          file,
          {
            upsert: false,
          }
        )

      if (uploadError) {
        console.error(
          'DOCUMENT UPLOAD ERROR:',
          uploadError
        )

        setError(uploadError.message)
        setUploading(false)
        return
      }

      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await supabase.storage
        .from('documents')
        .createSignedUrl(
          filePath,
          60 * 60 * 24 * 365
        )

      if (signedUrlError) {
        console.error(
          'SIGNED URL ERROR:',
          signedUrlError
        )

        setError(signedUrlError.message)
        setUploading(false)
        return
      }

      const {
        error: databaseError,
      } = await supabase
        .from('documents')
        .insert({
          employee_id: user.id,
          document_name: documentName.trim(),
          document_type: documentType,
          file_url: signedUrlData.signedUrl,
          uploaded_by: user.id,
        })

      if (databaseError) {
        console.error(
          'DOCUMENT DATABASE ERROR:',
          databaseError
        )

        setError(databaseError.message)

        await supabase.storage
          .from('documents')
          .remove([filePath])

        setUploading(false)
        return
      }

      setSuccess(
        'Document uploaded successfully.'
      )

      setFile(null)
      setDocumentName('')
      setDocumentType('Other')

      event.target.reset()

      await loadDocuments()
    } catch (uploadException) {
      console.error(
        'DOCUMENT UPLOAD EXCEPTION:',
        uploadException
      )

      setError(
        'Unable to upload document.'
      )
    }

    setUploading(false)
  }

  const handleOpenDocument = (document) => {
    setError('')

    if (!document.file_url) {
      setError(
        'Document URL is unavailable.'
      )
      return
    }

    window.open(
      document.file_url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  if (loading) {
    return (
      <div className="documents-page">
        <div className="documents-shell">
          <div className="documents-loading">
            <div className="documents-loading-mark">
              D
            </div>

            <div>
              <strong>
                Loading your documents
              </strong>

              <span>
                Preparing your document library...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="documents-page">
      <div className="documents-shell">

        {/* HEADER */}

        <header className="documents-header">
          <div className="documents-brand">
            <span className="documents-eyebrow">
              EMPLOYEE PORTAL
            </span>

            <h1>DayFlow</h1>

            <p>
              Keep your important employee documents
              organized in one place.
            </p>
          </div>

          <button
            type="button"
            className="documents-back-button"
            onClick={() =>
              navigate('/employee/dashboard')
            }
          >
            ← Back to Dashboard
          </button>
        </header>

        {/* INTRO */}

        <section className="documents-intro">
          <div>
            <span className="documents-section-label">
              DOCUMENT CENTER
            </span>

            <h2>My Documents</h2>

            <p>
              Upload, store and access your important
              employee documents securely.
            </p>
          </div>

          <div className="documents-count">
            <strong>{documents.length}</strong>
            <span>
              {documents.length === 1
                ? 'Document'
                : 'Documents'}
            </span>
          </div>
        </section>

        {/* ALERTS */}

        {error && (
          <div className="documents-alert documents-alert-error">
            <span className="documents-alert-icon">
              !
            </span>

            <div>
              <strong>
                Something needs your attention
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="documents-alert documents-alert-success">
            <span className="documents-alert-icon">
              ✓
            </span>

            <div>
              <strong>
                Upload successful
              </strong>

              <p>{success}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccess('')}
            >
              ×
            </button>
          </div>
        )}

        {/* UPLOAD */}

        <section className="documents-section">
          <div className="documents-section-heading">
            <div>
              <span className="documents-section-label">
                ADD DOCUMENT
              </span>

              <h3>
                Upload a new document
              </h3>

              <p>
                Supported formats: PDF, PNG, JPG, DOC
                and DOCX.
              </p>
            </div>
          </div>

          <form
            className="documents-upload-card"
            onSubmit={handleUpload}
          >
            <div className="documents-upload-icon">
              ↑
            </div>

            <div className="documents-form-grid">

              <div className="documents-field">
                <label htmlFor="documentName">
                  Document Name
                </label>

                <input
                  id="documentName"
                  type="text"
                  value={documentName}
                  onChange={(event) =>
                    setDocumentName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Aadhaar Card"
                />
              </div>

              <div className="documents-field">
                <label htmlFor="documentType">
                  Document Type
                </label>
                 <div className="document-custom-select">

                    <button
                      type="button"
                      className={`document-select-trigger ${
                        documentTypeOpen
                          ? 'document-select-trigger-open'
                          : ''
                      }`}
                      onClick={() =>
                        setDocumentTypeOpen(
                          !documentTypeOpen
                        )
                      }
                    >
                      <span>{documentType}</span>

                      <span className="document-select-arrow">
                        {documentTypeOpen ? '⌃' : '⌄'}
                      </span>
                    </button>

                    {documentTypeOpen && (
                      <div className="document-select-options">

                        {[
                          'Aadhaar',
                          'PAN',
                          'Resume',
                          'Certificate',
                          'Offer Letter',
                          'Other',
                        ].map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`document-select-option ${
                              documentType === type
                                ? 'document-select-option-active'
                                : ''
                            }`}
                            onClick={() => {
                              setDocumentType(type)
                              setDocumentTypeOpen(false)
                            }}
                          >
                            <span>{type}</span>

                            {documentType === type && (
                              <span className="document-option-check">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}

                      </div>
                    )}

                  </div>
          
              </div>

              <div className="documents-field documents-file-field">
                <label htmlFor="documentFile">
                  Select File
                </label>

                <input
                  id="documentFile"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(event) =>
                    setFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />

                {file && (
                  <span className="documents-selected-file">
                    Selected: {file.name}
                  </span>
                )}
              </div>

              <div className="documents-upload-action">
                <button
                  type="submit"
                  disabled={uploading}
                >
                  {uploading
                    ? 'Uploading...'
                    : 'Upload Document'}
                </button>
              </div>

            </div>
          </form>
        </section>

        {/* DOCUMENT LIST */}

        <section className="documents-section documents-list-section">

          <div className="documents-section-heading">
            <div>
              <span className="documents-section-label">
                YOUR FILES
              </span>

              <h3>
                Uploaded Documents
              </h3>

              <p>
                Access your previously uploaded
                documents.
              </p>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="documents-empty-state">
              <div className="documents-empty-icon">
                DOC
              </div>

              <h4>
                No documents uploaded yet
              </h4>

              <p>
                Upload your first employee document
                using the form above.
              </p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="document-card"
                >
                  <div className="document-card-top">

                    <div className="document-file-icon">
                      {getDocumentIcon(
                        document.document_type
                      )}
                    </div>

                    <span className="document-type-badge">
                      {document.document_type}
                    </span>

                  </div>

                  <div className="document-card-content">
                    <h4>
                      {document.document_name}
                    </h4>

                    <p>
                      Uploaded on{' '}
                      {formatDate(
                        document.created_at
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="document-open-button"
                    onClick={() =>
                      handleOpenDocument(
                        document
                      )
                    }
                  >
                    Open Document
                    <span>→</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}

        <footer className="documents-footer">
          <span>
            DayFlow Employee Portal
          </span>

         
        </footer>

      </div>
    </div>
  )
}

export default Documents
