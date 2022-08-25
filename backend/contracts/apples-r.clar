(define-fungible-token apples-r)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-amount-zero (err u101))

(define-read-only (get-symbol)
  (ok "rapp")
)

;; Custom function to mint tokens, only available to the contract owner
(define-public (mint (amount uint) (who principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (> amount u0) err-amount-zero)
    ;; amount, who are unchecked, but we let the contract owner mint to whoever they like for convenience
    ;; #[allow(unchecked_data)]
    (ft-mint? apples-r amount who)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-owner-only)
    (asserts! (> amount u0) err-amount-zero)
    ;; recipient is unchecked, anyone can transfer their tokens to anyone else
    ;; #[allow(unchecked_data)]
    (ft-transfer? apples-r amount sender recipient)
  )
)

(define-read-only (get-balance (who principal))
  (ft-get-balance apples-r who)
)