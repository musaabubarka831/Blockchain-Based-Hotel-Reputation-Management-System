;; Review Authentication Contract
;; Ensures feedback comes from real guests

(define-data-var admin principal tx-sender)

;; Map to store verified stays (simplified version of guest-verification)
(define-map verified-stays
  {guest: principal, property: principal, check-in-date: uint}
  bool
)

;; Map to store reviews
(define-map reviews
  {reviewer: principal, property: principal, timestamp: uint}
  {
    rating: uint,
    review-text: (string-utf8 500),
    authenticated: bool,
    stay-check-in-date: uint
  }
)

;; Function to verify a stay (simplified for testing)
(define-public (verify-stay (guest principal) (property principal) (check-in-date uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u3))
    (ok (map-set verified-stays {guest: guest, property: property, check-in-date: check-in-date} true))
  )
)

;; Public function to submit a review
(define-public (submit-review
    (property principal)
    (rating uint)
    (review-text (string-utf8 500))
    (stay-check-in-date uint))
  (let ((reviewer tx-sender))
    (begin
      ;; Verify the guest actually stayed at the property
      (asserts! (default-to false (map-get? verified-stays {guest: reviewer, property: property, check-in-date: stay-check-in-date})) (err u1))
      ;; Rating must be between 1 and 5
      (asserts! (and (>= rating u1) (<= rating u5)) (err u2))
      (ok (map-set reviews
        {reviewer: reviewer, property: property, timestamp: block-height}
        {
          rating: rating,
          review-text: review-text,
          authenticated: true,
          stay-check-in-date: stay-check-in-date
        }
      ))
    )
  )
)

;; Read-only function to check if a review is authenticated
(define-read-only (is-review-authenticated (reviewer principal) (property principal) (timestamp uint))
  (default-to false (get authenticated (map-get? reviews {reviewer: reviewer, property: property, timestamp: timestamp})))
)

;; Read-only function to get review details
(define-read-only (get-review-details (reviewer principal) (property principal) (timestamp uint))
  (map-get? reviews {reviewer: reviewer, property: property, timestamp: timestamp})
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u3))
    (ok (var-set admin new-admin))
  )
)
