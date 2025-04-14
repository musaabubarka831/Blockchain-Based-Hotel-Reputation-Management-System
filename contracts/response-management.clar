;; Response Management Contract
;; Tracks hotel engagement with reviews

(define-data-var admin principal tx-sender)

;; Map to store verified properties (simplified version of property-verification)
(define-map verified-properties principal bool)

;; Map to store authenticated reviews (simplified version of review-authentication)
(define-map authenticated-reviews
  {reviewer: principal, property: principal, timestamp: uint}
  bool
)

;; Map to store responses to reviews
(define-map responses
  {property: principal, reviewer: principal, review-timestamp: uint}
  {
    response-text: (string-utf8 500),
    response-timestamp: uint,
    response-updated: bool
  }
)

;; Function to verify a property (simplified for testing)
(define-public (verify-property (property principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u4))
    (ok (map-set verified-properties property true))
  )
)

;; Function to authenticate a review (simplified for testing)
(define-public (authenticate-review (reviewer principal) (property principal) (timestamp uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u5))
    (ok (map-set authenticated-reviews {reviewer: reviewer, property: property, timestamp: timestamp} true))
  )
)

;; Public function for properties to respond to reviews
(define-public (respond-to-review
    (reviewer principal)
    (review-timestamp uint)
    (response-text (string-utf8 500)))
  (let ((property tx-sender))
    (begin
      ;; Verify the property is registered
      (asserts! (default-to false (map-get? verified-properties property)) (err u1))
      ;; Verify the review exists and is authenticated
      (asserts! (default-to false (map-get? authenticated-reviews {reviewer: reviewer, property: property, timestamp: review-timestamp})) (err u2))
      (ok (map-set responses
        {property: property, reviewer: reviewer, review-timestamp: review-timestamp}
        {
          response-text: response-text,
          response-timestamp: block-height,
          response-updated: true
        }
      ))
    )
  )
)

;; Read-only function to check if a property has responded to a review
(define-read-only (has-response (property principal) (reviewer principal) (review-timestamp uint))
  (default-to false (get response-updated (map-get? responses {property: property, reviewer: reviewer, review-timestamp: review-timestamp})))
)

;; Read-only function to get response details
(define-read-only (get-response-details (property principal) (reviewer principal) (review-timestamp uint))
  (map-get? responses {property: property, reviewer: reviewer, review-timestamp: review-timestamp})
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u3))
    (ok (var-set admin new-admin))
  )
)
