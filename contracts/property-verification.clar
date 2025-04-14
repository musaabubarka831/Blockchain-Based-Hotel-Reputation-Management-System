;; Property Verification Contract
;; Validates legitimate accommodation providers

(define-data-var admin principal tx-sender)

;; Map to store verified properties
(define-map verified-properties
  principal
  {
    name: (string-utf8 100),
    location: (string-utf8 100),
    verified: bool,
    verification-date: uint
  }
)

;; Public function to register a property (only admin can verify)
(define-public (register-property (name (string-utf8 100)) (location (string-utf8 100)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set verified-properties tx-sender
      {
        name: name,
        location: location,
        verified: true,
        verification-date: block-height
      }
    ))
  )
)

;; Read-only function to check if a property is verified
(define-read-only (is-property-verified (property principal))
  (default-to false (get verified (map-get? verified-properties property)))
)

;; Read-only function to get property details
(define-read-only (get-property-details (property principal))
  (map-get? verified-properties property)
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u2))
    (ok (var-set admin new-admin))
  )
)
