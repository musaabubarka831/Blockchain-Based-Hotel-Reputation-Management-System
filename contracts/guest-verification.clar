;; Guest Verification Contract
;; Confirms actual stays at properties

(define-data-var admin principal tx-sender)

;; Map to store verified properties (simplified version of property-verification)
(define-map verified-properties principal bool)

;; Map to store guest stays
(define-map guest-stays
  {guest: principal, property: principal, check-in-date: uint}
  {
    check-out-date: uint,
    stay-confirmed: bool,
    stay-id: (string-utf8 36)
  }
)

;; Function to verify a property (simplified for testing)
(define-public (verify-property (property principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u3))
    (ok (map-set verified-properties property true))
  )
)

;; Public function for properties to register a guest stay
(define-public (register-stay (guest principal) (check-in-date uint) (check-out-date uint) (stay-id (string-utf8 36)))
  (let ((property tx-sender))
    (begin
      ;; Property must be verified
      (asserts! (default-to false (map-get? verified-properties property)) (err u1))
      (ok (map-set guest-stays
        {guest: guest, property: property, check-in-date: check-in-date}
        {
          check-out-date: check-out-date,
          stay-confirmed: true,
          stay-id: stay-id
        }
      ))
    )
  )
)

;; Read-only function to verify if a guest stayed at a property
(define-read-only (verify-stay (guest principal) (property principal) (check-in-date uint))
  (default-to false (get stay-confirmed (map-get? guest-stays {guest: guest, property: property, check-in-date: check-in-date})))
)

;; Read-only function to get stay details
(define-read-only (get-stay-details (guest principal) (property principal) (check-in-date uint))
  (map-get? guest-stays {guest: guest, property: property, check-in-date: check-in-date})
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u2))
    (ok (var-set admin new-admin))
  )
)
