
(use-trait sip-010-trait .sip-010-trait-ft-standard.sip-010-trait)

(define-constant contract-owner 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant no-liquidity-err (err u61))
(define-constant not-owner-err (err u63))
(define-constant no-fee-to-address-err (err u64))
(define-constant invalid-pair-err (err u65))
(define-constant no-such-position-err (err u66))
(define-constant balance-too-low-err (err u67))
(define-constant too-many-pairs-err (err u68))
(define-constant pair-already-exists-err (err u69))
(define-constant wrong-token-err (err u70))
(define-constant too-much-slippage-err (err u71))
(define-constant transfer-x-failed-err (err u72))
(define-constant transfer-y-failed-err (err u73))
(define-constant transfer-lp-failed-err (err u74))
(define-constant value-out-of-range-err (err u75))
(define-constant no-fee-x-err (err u76))
(define-constant no-fee-y-err (err u77))
(define-constant not-enough-fund-err (err u78))
(define-constant fee-mismatch-err (err u79))
(define-constant ERR_CANNOT_STAKE (err u80))
(define-constant CONTRACT_ADDRESS 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stableswap-v2)
(define-constant fee-to-address 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stableswap-v2)
(define-constant init-bh block-height)
(define-constant MAX_REWARD_CYCLES u32)
(define-constant REWARD_CYCLE_INDEXES (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31))


(define-data-var loan-fee-num uint u10)
(define-data-var loan-fee-den uint u1000)

(define-map pairs-map
  { pair-id: uint }
  {
    token-x: principal,
    token-y: principal,
  }
)

(define-map pairs-data-map
  {
    token-x: principal,
    token-y: principal,
  }
  {
    shares-total: uint,
    balance-x: uint,
    balance-y: uint,
    fee-balance-x: uint,
    fee-balance-y: uint,
    fee-to-address: (optional principal), 
    name: (string-ascii 32),
  }
)

(define-data-var pair-count uint u0)

;; ;; in practice would be longer, but this is ~ 1 hour for the hackathon
(define-data-var cycleLength uint u6)

;; ;; cycle fee data
(define-map CycleFeeData 
  { 
    token-x: principal, 
    token-y: principal, 
    cycleNum: uint,
  }
  {
    token-x-bal: uint,
    token-y-bal: uint,
    total-lp-staked: uint,
  }
)

(define-map UserStakingData
  {
    token-x: principal,
    token-y: principal,
    rewardCycle: uint,
    who: principal
  }
  {
    lp-staked: uint,
    reward-claimed: bool
  }
)

(define-read-only (get-name (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err))
    )
    (ok (get name pair))
  )
)

(define-public (get-symbol (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>))
  (ok
    (concat
      (unwrap-panic (as-max-len? (unwrap-panic (contract-call? token-x-trait get-symbol)) u15))
      (concat "-"
        (unwrap-panic (as-max-len? (unwrap-panic (contract-call? token-y-trait get-symbol)) u15))
      )
    )
  )
)

(define-read-only (get-total-supply (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err))
    )
    (ok (get shares-total pair))
  )
)

;; get the total number of shares issued for the pool
(define-read-only (get-shares (token-x principal) (token-y principal))
  (ok (get shares-total (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
)

;; get overall balances for the pair
(define-public (get-balances (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err))
    )
    (ok (list (get balance-x pair) (get balance-y pair)))
  )
)


(define-read-only (get-pair-details (token-x principal) (token-y principal))
  (unwrap-panic (map-get? pairs-data-map { token-x: token-x, token-y: token-y }))
)

(define-read-only (get-pair-contracts (pair-id uint))
  (unwrap-panic (map-get? pairs-map { pair-id: pair-id }))
)

(define-read-only (get-pair-count)
  (ok (var-get pair-count))
)


(define-public (create-pair (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>) (pair-name (string-ascii 32)) (x uint) (y uint))
  ;; TOOD(psq): add creation checks, then create map before proceeding to add-to-position
  ;; check neither x,y or y,x exists`
  (let
    (
      (name-x (unwrap-panic (contract-call? token-x-trait get-name)))
      (name-y (unwrap-panic (contract-call? token-y-trait get-name)))
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair-id (+ (var-get pair-count) u1))
      (pair-data {
        shares-total: u0,
        balance-x: u0,
        balance-y: u0,
        fee-balance-x: u0,
        fee-balance-y: u0,
        fee-to-address: none,
        name: pair-name,
      })
    )
    ;; trying to add a pair for xusd-usda when the usda-xusd pair already exists will fail
    (asserts!
      (and
        (is-none (map-get? pairs-data-map { token-x: token-x, token-y: token-y }))
        (is-none (map-get? pairs-data-map { token-x: token-y, token-y: token-x }))
      )
      pair-already-exists-err
    )

    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-data)

    (map-set pairs-map { pair-id: pair-id } { token-x: token-x, token-y: token-y })
    (var-set pair-count pair-id)
    (try! (add-to-position token-x-trait token-y-trait x y))
    (print { object: "pair", action: "created", data: pair-data })
    (ok true)
  )
)

;; add tokens to a liquidity pool and receive LP tokens in return
(define-public (add-to-position (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>) (x uint) (y uint))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap-panic (map-get? pairs-data-map { token-x: token-x, token-y: token-y })))
      (contract-address (as-contract tx-sender))
      (recipient-address tx-sender)
      (balance-x (get balance-x pair))
      (balance-y (get balance-y pair))
      (who tx-sender)

      (new-y
        (if (is-eq (get shares-total pair) u0)
          y
          (/ (* x balance-y) balance-x)
        )
      )
      (new-shares
        (if (is-eq (get shares-total pair) u0)
          (sqrti (* (+ balance-x x) (+ balance-y new-y)))
          (- (sqrti (* (+ balance-x x) (+ balance-y new-y))) (get shares-total pair))
        )
      )
      (pair-updated (merge pair {
        shares-total: (+ new-shares (get shares-total pair)),
        balance-x: (+ balance-x x),
        balance-y: (+ balance-y new-y)
      }))
      (new-amounts 
        {
            x-amount: x,
            y-amount: new-y
        }
      )
    )
    
    (asserts! (is-ok (as-contract (contract-call? .usd-lp mint new-shares who))) (err u1110))
    (asserts! (is-ok (contract-call? token-x-trait transfer x tx-sender contract-address none)) transfer-x-failed-err)
    (asserts! (is-ok (contract-call? token-y-trait transfer new-y tx-sender contract-address none)) transfer-y-failed-err)

    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
    (print { object: "pair", action: "liquidity-added", data: pair-updated })
    (ok true)
  )
)

;; ;; convert lp tokens back to the underlying tokens in the liquidity pool: burn lp tokens, send withdrawal of token-x and token-y to user
(define-public (reduce-position (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>) (percent uint))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err))
      (balance-x (get balance-x pair))
      (balance-y (get balance-y pair))
      (shares (unwrap! (contract-call? .usd-lp get-balance tx-sender) (err u1110)))
      (shares-total (get shares-total pair))
      (contract-address (as-contract tx-sender))
      (sender tx-sender)
      (withdrawal (/ (* shares percent) u100))
      (withdrawal-x (/ (* withdrawal balance-x) shares-total))
      (withdrawal-y (/ (* withdrawal balance-y) shares-total))
      (pair-updated
        (merge pair
          {
            shares-total: (- shares-total withdrawal),
            balance-x: (- (get balance-x pair) withdrawal-x),
            balance-y: (- (get balance-y pair) withdrawal-y)
          }
        )
      )
    )

    (asserts! (<= percent u100) value-out-of-range-err)
    (asserts! (is-ok (contract-call? .usd-lp burn tx-sender withdrawal)) (err u1110))
    (asserts! (is-ok (as-contract (contract-call? token-x-trait transfer withdrawal-x contract-address sender none))) transfer-x-failed-err)
    (asserts! (is-ok (as-contract (contract-call? token-y-trait transfer withdrawal-y contract-address sender none))) transfer-y-failed-err)

    ;; (unwrap-panic (decrease-shares token-x token-y tx-sender withdrawal)) ;; should never fail, you know...
    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
    (print { object: "pair", action: "liquidity-removed", data: pair-updated })
    (ok (list withdrawal-x withdrawal-y))
  )
)


;; swap dx of token-x for some amount dy of token-y based on current liquidity pool, returns (dx dy)
;; swap will fail when slippage is too high (trader doesn't get at least min-dy in return)
(define-public (swap-x-for-y (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>) (dx uint) (min-dy uint))
  ;; calculate dy
  ;; calculate fee on dx
  ;; transfer
  ;; update balances
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err))
      (balance-x (get balance-x pair))
      (balance-y (get balance-y pair))
      (contract-address (as-contract tx-sender))
      (sender tx-sender)
      (dy (/ (* u1000 balance-y dx) (+ (* u1000 balance-x) (* u1000 dx))))
      (fee (/ (* u4 dx) u10000)) ;; 4 basis points
      (pair-updated
        (merge pair
          {
            balance-x: (+ (get balance-x pair) dx),
            balance-y: (- (get balance-y pair) dy),
            fee-balance-x: (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
              (+ fee (get fee-balance-x pair))
              (get fee-balance-x pair))
          }
        )
      )
    )

    ;; (asserts! (< min-dy dy) too-much-slippage-err) ;;now enforced by post conditions

    (asserts! (is-ok (contract-call? token-x-trait transfer dx sender contract-address none)) transfer-x-failed-err)
    (asserts! (is-ok (as-contract (contract-call? token-y-trait transfer dy contract-address sender none))) transfer-y-failed-err)

    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
    (print { object: "pair", action: "swap-x-for-y", data: pair-updated })
    (ok (list dx dy))
  )
)

;; swap dy of token-y for some amount dx of token-x based on current liquidity pool, returns (dy dx)
;; swap will fail when slippage is too high (trader doesn't get at least min-dx in return)
(define-public (swap-y-for-x (token-y-trait <sip-010-trait>) (token-x-trait <sip-010-trait>) (dy uint) (min-dx uint))
  ;; calculate dx
  ;; calculate fee on dy
  ;; transfer
  ;; update balances
  (let ((token-x (contract-of token-x-trait))
        (token-y (contract-of token-y-trait))
        (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err))
        (balance-x (get balance-x pair))
        (balance-y (get balance-y pair))
        (contract-address (as-contract tx-sender))
        (sender tx-sender)
        ;; check formula, vs x-for-y???
        (dx (/ (* u997 balance-x dy) (+ (* u1000 balance-y) (* u997 dy)))) ;; overall fee is 30 bp, either all for the pool, or 25 bp for pool and 5 bp for operator
        (fee (/ (* u5 dy) u10000)) ;; 5 bp
        (pair-updated (merge pair {
          balance-x: (- (get balance-x pair) dx),
          balance-y: (+ (get balance-y pair) dy),
          fee-balance-y: (if (is-some (get fee-to-address pair))  ;; only collect fee when fee-to-address is set
            (+ fee (get fee-balance-y pair))
            (get fee-balance-y pair))
        })))

    ;; (asserts! (< min-dx dx) too-much-slippage-err) ;;now handled in post conditions

    (asserts! (is-ok (contract-call? token-y-trait transfer dy sender contract-address none)) transfer-y-failed-err)
    (asserts! (is-ok (as-contract (contract-call? token-x-trait transfer dx contract-address sender none))) transfer-x-failed-err)

    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
    (print { object: "pair", action: "swap-y-for-x", data: pair-updated })
    (ok (list dy dx))
  )
)

;; get the current address used to collect a fee
;; (define-read-only (get-fee-to-address (token-x principal) (token-y principal))
;;   (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
;;     (ok (get fee-to-address pair))
;;   )
;; )

;; get the amount of fees charged on x-token and y-token exchanges that have not been collected yet
;; (define-read-only (get-fees (token-x principal) (token-y principal))
;;   (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err)))
;;     (ok (list (get fee-balance-x pair) (get fee-balance-y pair)))
;;   )
;; )

;; send the collected fees the fee-to-address
;; (define-public (collect-fees (token-x-trait <sip-010-trait>) (token-y-trait <sip-010-trait>))
;;   (let
;;     (
;;       (token-x (contract-of token-x-trait))
;;       (token-y (contract-of token-y-trait))
;;       (contract-address (as-contract tx-sender))
;;       (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) invalid-pair-err))
;;       (address (unwrap! (get fee-to-address pair) no-fee-to-address-err))
;;       (fee-x (get fee-balance-x pair))
;;       (fee-y (get fee-balance-y pair))
;;     )

;;     (asserts! (is-eq fee-x u0) no-fee-x-err)
;;     (asserts! (is-ok (as-contract (contract-call? token-x-trait transfer fee-x contract-address address none))) transfer-x-failed-err)
;;     (asserts! (is-eq fee-y u0) no-fee-y-err)
;;     (asserts! (is-ok (as-contract (contract-call? token-y-trait transfer fee-y contract-address address none))) transfer-y-failed-err)

;;     (map-set pairs-data-map { token-x: token-x, token-y: token-y }
;;       {
;;         shares-total: (get shares-total pair),
;;         balance-x: (get balance-x pair),
;;         balance-y: (get balance-y pair),
;;         fee-balance-x: u0,
;;         fee-balance-y: u0,
;;         fee-to-address: (get fee-to-address pair),
;;         name: (get name pair),
;;       }
;;     )
;;     (ok (list fee-x fee-y))
;;   )
;; )

(define-read-only (get-current-cycle)
  (let 
    (
      (diff (- block-height init-bh))
      (cycle (/ diff u6))
    ) 
    (ok cycle)
  )
)

;; grabs the total amount of fees collected in token-x and in token-y by cycle
;; number of token-x and token-y goes up with every trade
(define-read-only (get-total-cycle-fee (token-x principal) (token-y principal) (cycleNum uint))
 (default-to
    {token-x-bal: u0, token-y-bal: u0, total-lp-staked: u0} 
    (map-get? CycleFeeData 
      {
        token-x: token-x,
        token-y: token-y,
        cycleNum: cycleNum
      }
    )
  )
)

(define-read-only (get-lp-staked-by-user-at-cycle (token-x principal) (token-y principal) (rewardCycle uint) (who principal))
 (default-to
    {lp-staked: u0, reward-claimed: false} 
      (map-get? UserStakingData 
      {
        token-x: token-x,
        token-y: token-y,
        rewardCycle: rewardCycle,
        who: who
      }
    )
  )
)

(define-private (set-lp-staked-by-user-at-cycle (token-x principal) (token-y principal) (rewardCycle uint) (who principal) (amount uint))
  (let 
    (
    (cycleFeeData (get-total-cycle-fee token-x token-y rewardCycle))
    (userStakingData (get-lp-staked-by-user-at-cycle token-x token-y rewardCycle who))
    (totalAmountStaked (get total-lp-staked cycleFeeData))
    (token-x-bal (get token-x-bal cycleFeeData))
    (token-y-bal (get token-y-bal cycleFeeData))
    (claimed (get reward-claimed userStakingData))
    (user-staked (get lp-staked userStakingData))
    )
    (begin 
      (map-set CycleFeeData
        {
          token-x: token-x,
          token-y: token-y,
          cycleNum: rewardCycle
        }
        {
          token-x-bal: token-x-bal,
          token-y-bal: token-y-bal,
          ;; token-y-bal: token-x-bal, ;; y was set to x before for some reason
          total-lp-staked: (+ totalAmountStaked amount),
        }
      )
      (map-set UserStakingData
        {
          token-x: token-x,
          token-y: token-y,
          rewardCycle: rewardCycle,
          who: who
        }
        {
          lp-staked: (+ user-staked amount),
          reward-claimed: claimed
        }
      )
    )
    (ok true)
  )
)

(define-private (stake-lp-at-cycle (who principal) (amt uint) (cycle-num uint) (token-x principal) (token-y principal)) 
  (as-contract (set-lp-staked-by-user-at-cycle token-x token-y cycle-num who amt))
)

(define-private (update-user-staking-data (cycle uint) (user-info {token-x: principal, token-y: principal, amt: uint, who: principal}))
  ;; (stake-lp-at-cycle (get who user-info) (get lp-token user-info) (get amt user-info) cycle)
  (let (
    (token-x (get token-x user-info))
    (token-y (get token-y user-info))
    (amt (get amt user-info))
    (who (get who user-info))
    ) 
    (if (is-ok (stake-lp-at-cycle who amt cycle token-x token-y))
      user-info
      user-info ;; should return something else here to showcase that stake-lp-at-cycle threw an error
    )
  )
)

;; need to assert that amount is <= how many LP tokens the user has
;; need to replace reward_cycle_indexes with a list that represents the actual cycle numbers
(define-public (stake-LP-tokens (lp-token <sip-010-trait>) (token-x <sip-010-trait>) (token-y <sip-010-trait>) (amount uint) (numCycles uint))
  (begin 
    (asserts! (is-ok (contract-call? lp-token transfer amount tx-sender CONTRACT_ADDRESS none)) transfer-lp-failed-err)
    (ok (fold update-user-staking-data REWARD_CYCLE_INDEXES {token-x: (contract-of token-x), token-y: (contract-of token-y), amt: amount, who: tx-sender}))
  )
)


;; (define-public (stake-usd-lp (who principal) (lp-amount uint) (num-cycles uint)) 
;;   (begin 
;;     ;; (asserts! (< block-height (unwrap-panic (get-current-cycle)) (err 1010101)))
;;     (ok who) 
;;   )
;; )

;; (define-public (stake-lp-tokens (amountTokens uint) (lockPeriod uint))
;;   (let
;;     (
;;       (userId tx-sender)
;;     )
;;     (try! (stake-lp-tokens-at-cycle tx-sender userId amountTokens block-height lockPeriod))
;;     (ok true)
;;   )
;; )

;; (define-private (stake-lp-tokens-at-cycle (who principal) (amountTokens uint) (lockPeriod uint))
;;     (let
;;     (
;;       (currentCycle (unwrap! (get-current-cycle) (err u1000000000)))
;;       (targetCycle (+ u1 currentCycle))
;;       (commitment {
;;         stackerId: who,
;;         amount: amountTokens,
;;         first: targetCycle,
;;         last: (+ targetCycle lockPeriod)
;;       })
;;     )
;;     (asserts! (and (> lockPeriod u0) (<= lockPeriod MAX_REWARD_CYCLES)) (err ERR_CANNOT_STAKE))
;;     (asserts! (> amountTokens u0) (err ERR_CANNOT_STAKE))
;;     (try! (contract-call? .usd-lp transfer amountTokens tx-sender (as-contract tx-sender) none))
;;     (match (fold stack-tokens-closure REWARD_CYCLE_INDEXES (ok commitment))
;;       okValue (ok true)
;;       errValue (err errValue)
;;     )
;;   )
;; )

;; (define-private (stack-tokens-closure (token-x principal) (token-y principal) (rewardCycle uint) (who principal) (amount uint) (rewardCycleIdx uint)
;;   (commitmentResponse (response 
;;     {
;;       stackerId: uint,
;;       amount: uint,
;;       first: uint,
;;       last: uint
;;     }
;;     uint
;;   )))

;;   (match commitmentResponse
;;     commitment 
;;     (let
;;       (
;;         (stackerId (get stackerId commitment))
;;         (amountToken (get amount commitment))
;;         (firstCycle (get first commitment))
;;         (lastCycle (get last commitment))
;;         (targetCycle (+ firstCycle rewardCycleIdx))
;;         (userStakingData (get-lp-staked-by-user-at-cycle token-x token-y rewardCycle who))
;;         (amountStacked (get lp-staked userStakingData))
;;         (claimed (get reward-claimed userStakingData))
;;       )
;;       (begin
;;         (if (and (>= targetCycle firstCycle) (< targetCycle lastCycle))
;;           (begin
;;             (if (is-eq targetCycle (- lastCycle u1))
;;               (set-lp-staked-by-user-at-cycle token-x token-y rewardCycle who amount)
;;               (set-lp-staked-by-user-at-cycle token-x token-y rewardCycle who u0)
;;             )
;;             true
;;           )
;;           false
;;         )
;;         commitmentResponse
;;       )
;;     )
;;     errValue commitmentResponse
;;   )
;; )




;; ;; ;; cycle fee data
;; (define-map CycleFeeData 
;;   { 
;;     token-x: principal, 
;;     token-y: principal, 
;;     cycleNum: uint,
;;   }
;;   {
;;     token-x-bal: uint,
;;     token-y-bal: uint,
;;     total-lp-staked: uint,
;;   }
;; )

;; (define-map UserStakingData
;;   {
;;     token-x: principal,
;;     token-y: principal,
;;     rewardCycle: uint,
;;     who: principal
;;   }
;;   {
;;     lp-staked: uint,
;;     reward-claimed: bool
;;   }
;; )