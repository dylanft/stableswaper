import { Component, OnInit } from '@angular/core';
import { getGlobalObject } from '@stacks/common';
import { openContractCall } from '@stacks/connect';
import { StacksMocknet, StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
  callReadOnlyFunction,
  ContractPrincipal,
  contractPrincipalCV,
  ContractPrincipalCV,
  contractPrincipalCVFromAddress,
  createAddress,
  createAssetInfo,
  createLPString,
  cvToValue,
  FungibleConditionCode,
  getTypeString,
  intCV,
  makeContractFungiblePostCondition,
  makeStandardFungiblePostCondition,
  makeStandardSTXPostCondition,
  PostConditionMode,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
} from '@stacks/transactions';
import { principalCV, standardPrincipalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
import { userSession } from 'src/stacksUserSession';


export interface CycleDatapoint{
  position: number;
  startBlock: string;
  totalLPtokens: number;
  userLPtokens: number;
  userRewards: number;
  userCTA: string;
}

const CYCLES_DATA: CycleDatapoint[] = [
  {position: 1, startBlock: '1000', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 1.23, userCTA: 'claimed'},
  {position: 2, startBlock: '1100', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 1.23, userCTA: 'claim'},
  {position: 3, startBlock: '1200', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 1.23, userCTA: 'claim'},
  {position: 4, startBlock: '1300', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 0.615, userCTA: 'in-progress'},
  {position: 5, startBlock: '1400', totalLPtokens: 123456, userLPtokens: 123.456, userRewards: 0, userCTA: 'upcoming'},
  {position: 6, startBlock: '1500', totalLPtokens: 123332, userLPtokens: 0, userRewards: 0, userCTA: 'N/A'},
];

@Component({
  selector: 'earn',
  templateUrl: './earn.component.html',
  styleUrls: ['./earn.component.css']
})
export class EarnComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  public userSession = userSession;
  deployerAddress: string = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  tokenList: any[] = ['USDA', 'xUSD'];
  lpTokenList: any[] = ['USDA-xUSD-LP']
  earnOptions: any[] = ['USDA-xUSD-LP', 'xBTC']
  poolChoice: string = 'add';
  cycleView: string = 'search';
  cycleClaimNumber: number = 1;
  currentCycle: number | null = null;
  network: any = new StacksMocknet();


  tokenA: string = '';
  tokenB: string = '';
  tokenA_amt: number = 0;
  tokenB_amt: number = 0;
  token_x_rewards: number = 0;
  token_y_rewards: number = 0;
  token_x_symbol: string = 'USDA';
  token_y_symbol: string = 'xUSD';

  lpToken: string = '';
  lpToken_amt_user: number = 0;
  lpToken_amt_user_earn: number = 0;
  lpToken_amt_user_pool: number = 0;
  lpToken_amt_total: number = 0;
  withdrawalPct: number = 100;

  lpTokenContractName: string = '';
  lpTokenAssetName: string = '';
  cycleRewardLPToken: string | null = '';
  clickedSearch: boolean = false;

  usdaContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress(this.deployerAddress),
    createLPString('usda-token')
  );

  xusdContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress(this.deployerAddress),
    createLPString('xusd-token')
  );

  xbtcContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress(this.deployerAddress),
    createLPString('xbtc-token')
  );

  usda_xusd_lpContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress(this.deployerAddress),
    createLPString('usd-lp')
  )

  numCycles: number = 50;

  displayedColumns: string[] = ['position', 'startBlock', 'totalLPtokens', 'userLPtokens', 'userRewards', 'userCTA']
  dataSource = [...CYCLES_DATA];

  swap(pick: string) {
    openContractCall({
      network: new StacksMocknet(),
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'example-fruit-vote-contract',
      functionName: 'vote',
      functionArgs: [stringUtf8CV(pick)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  swapStxForMagic(pick: string) {
    openContractCall({
      network: new StacksMocknet(),
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'beanstalk-exchange',
      functionName: 'stx-to-token-swap',
      functionArgs: [stringUtf8CV(pick)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  selectToken(event: any, tokenType: string) {
    // console.log("event: ", event)
    // console.log("event.value: ", event.value)
    if (tokenType == "A") {
      this.tokenA = event.value;
      console.log("tokenA: ", this.tokenA);
    }
    else if (tokenType == "B") {
      this.tokenB = event.value;
      console.log("tokenB: ", this.tokenB);
    }
    else if (tokenType == "LP-Earn") {
      this.lpToken = event.value;
      if (this.lpToken == 'USDA-xUSD-LP') {
        this.lpTokenContractName = 'usd-lp';
        this.lpTokenAssetName = 'usd-lp';
      }
      else if (this.lpToken == 'xBTC') {
          this.lpTokenContractName = 'xbtc-token';
          this.lpTokenAssetName = 'xbtc-token';
      }
      console.log("Earn Token: ", this.lpToken);
    }
    else if (tokenType == "LP-rewardCycle") {
      this.cycleRewardLPToken = event.value;
      if (this.cycleRewardLPToken == 'USDA-xUSD-LP') {
        this.lpTokenContractName = 'usd-lp';
        this.lpTokenAssetName = 'usd-lp';
      }
      console.log("LP-rewardCycle Token: ", this.cycleRewardLPToken);
    }
  }

  updateTokenAmount(val: string, tokenType: string) {
    //TODO: update this function to grab price of this # of stablecoins in real dollars based on AMM
    //TODO: display output below the amount entered in the text field
    console.log(val)
    if (tokenType == "LP-pool") {
      this.lpToken_amt_user_pool = parseInt(val);
    }
    else if (tokenType == "LP-earn") {
      this.lpToken_amt_user_earn = parseInt(val);
    }
    else if (tokenType=='Cycle') {
      this.cycleClaimNumber = parseInt(val)
    }
    else {
      this.tokenA_amt = parseInt(val);
      this.tokenB_amt = this.tokenA_amt;
    }
    
  }

  updateWithdrawalPercentage(val: string) {
    console.log("update withdrawal pct input:", val);
    var pct = parseInt(val);
    pct = Math.max(pct, 1);
    pct = Math.min(pct, 100);
    this.withdrawalPct = pct;
    console.log("update withdrawal pct output:", this.withdrawalPct);

  }

  toggle(poolOption: string) {
    this.poolChoice = poolOption;
    console.log(this.poolChoice)
  }

  cvToggle(cycleViewOption: string) {
    this.cycleView = cycleViewOption;
    console.log(this.cycleView)
  }

  printNumCycles() {
    console.log(this.numCycles)
  }


  addToPool() {
    var tx_amt = this.tokenA_amt * 1e6;
    var ty_amt = this.tokenB_amt * 1e6;
    var txSenderAddress: string;
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var createPoolPC1 = makeStandardFungiblePostCondition(
      txSenderAddress,
      FungibleConditionCode.LessEqual,
      tx_amt,
      createAssetInfo(this.deployerAddress, 'usda-token', 'usda')
    )

    var createPoolPC2 = makeStandardFungiblePostCondition(
      txSenderAddress,
      FungibleConditionCode.LessEqual,
      tx_amt,
      createAssetInfo(this.deployerAddress, 'xusd-token', 'xusd')
    )

    var tx = this.usdaContract;
    var ty = this.xusdContract;
    console.log("tx: ", tx)
    console.log("ty: ", ty)
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'add-to-position',
      functionArgs: [tx, ty, uintCV(tx_amt), uintCV(ty_amt)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [createPoolPC1, createPoolPC2],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }


  withdrawFromPool() {
    var txSenderAddress: string;
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var PC1 = makeStandardFungiblePostCondition(
      txSenderAddress,
      FungibleConditionCode.GreaterEqual,
      0,
      createAssetInfo(this.deployerAddress, 'usd-lp', 'usd-lp')
    )

    var PC2 = makeContractFungiblePostCondition(
      this.deployerAddress,
      'stableswap',
      FungibleConditionCode.GreaterEqual,
      0,
      createAssetInfo(this.deployerAddress, 'usda-token', 'usda') 
    )

    var PC3 = makeContractFungiblePostCondition(
      this.deployerAddress,
      'stableswap',
      FungibleConditionCode.GreaterEqual,
      0,
      createAssetInfo(this.deployerAddress, 'xusd-token', 'xusd') 
    )

    var tx = this.usdaContract;
    var ty = this.xusdContract;
    console.log("tx: ", tx)
    console.log("ty: ", ty)
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'reduce-position',
      functionArgs: [tx, ty, uintCV(this.withdrawalPct)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [PC1, PC2, PC3],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  stakeOrEscrow() {
    var txSenderAddress: string;
    var amountLPtokens = this.lpToken_amt_user_earn
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var PC1 = makeStandardFungiblePostCondition(
      txSenderAddress,
      FungibleConditionCode.Equal,
      amountLPtokens,
      createAssetInfo(this.deployerAddress, this.lpTokenContractName, this.lpTokenAssetName)
    )

    if (this.lpToken == 'USDA-xUSD-LP') {
      var token_x = this.usdaContract;
      var token_y = this.xusdContract;
      var token_lp = this.usda_xusd_lpContract;
      console.log("tx: ", token_x)
      console.log("ty: ", token_y)
      openContractCall({
        network: this.network,
        anchorMode: AnchorMode.Any,
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'stableswap',
        functionName: 'stake-LP-tokens',
        functionArgs: [token_lp, token_x, token_y, uintCV(amountLPtokens), uintCV(this.numCycles)],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [PC1],
        onFinish: (data) => {
          console.log('onFinish:', data);
          window
            ?.open(
              `http://localhost:8000/txid/${data.txId}?chain=testnet`,
              '_blank'
            )
            ?.focus();
        },
        onCancel: () => {
          console.log('onCancel:', 'Transaction was canceled');
        },
      });
    }
    else if (this.lpToken == 'xBTC') {
      openContractCall({
        network: this.network,
        anchorMode: AnchorMode.Any,
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'stableswap',
        functionName: 'escrow-xbtc',
        functionArgs: [this.xbtcContract, uintCV(amountLPtokens), uintCV(this.numCycles)],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          console.log('onFinish:', data);
          window
            ?.open(
              `http://localhost:8000/txid/${data.txId}?chain=testnet`,
              '_blank'
            )
            ?.focus();
        },
        onCancel: () => {
          console.log('onCancel:', 'Transaction was canceled');
        },
      });
    }
  }


  claimRewardsAtCycle() {
    this.getCurrentCycle();
    var txSenderAddress: string;
    var cycleNum = this.cycleClaimNumber;
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var token_x = this.usdaContract;
    var token_y = this.xusdContract;
    var token_lp = this.usda_xusd_lpContract;
    var token_xbtc = this.xbtcContract;
    console.log("tx: ", token_x)
    console.log("ty: ", token_y)
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'claim-rewards-at-cycle',
      functionArgs: [uintCV(cycleNum), token_x, token_y, token_lp, token_xbtc],
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }


  async getCurrentCycle() {
    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var options = {
      network: this.network,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'get-current-cycle',
      functionArgs: [],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    var output = cvToValue(result);
    this.currentCycle = output.value
  }

  async viewUsersRewardsAtCycle() {
    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var options = {
      network: this.network,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'get-current-cycle',
      functionArgs: [],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    console.log(result);
    console.log(result.type);
    this.clickedSearch = true;
    
    // get user lp staked
    var user_lp_cycle_info = (await this.getTotalLPStakedByUserAtCycle());
    var user_lp_staked = user_lp_cycle_info.at(0);
    var claimed = user_lp_cycle_info.at(1);
    var total_lp_staked = (await this.getTotalLPStakedAtCycle());

    var user_xbtc_escrowed = (await this.getTotalXBTCEscrowedByUserAtCycle());
    var total_xbtc_escrowed = (await this.getTotalXBTCEscrowedAtCycle());
    
    var total_rewards_at_cycle = (await this.viewTotalRewardsAtCycle());
    var total_cycle_rewards_x = total_rewards_at_cycle[0] //token x
    var total_cycle_rewards_y = total_rewards_at_cycle[1] //token y


    this.token_x_rewards = 0;
    this.token_y_rewards = 0;
    console.log("claimed: ", claimed)
    console.log("user_lp_staked: ", user_lp_staked)
    console.log("total_lp_staked: ", total_lp_staked)
    console.log("user_xbtc_escrowed: ", user_xbtc_escrowed)
    console.log("total_xbtc_escrowed: ", total_xbtc_escrowed)
    console.log("total_rewards_at_cycle", total_rewards_at_cycle)
    

    var is_lp = user_lp_staked > 0
    var is_verified_xbtc_holder = user_xbtc_escrowed > 0
    var is_both = is_lp && is_verified_xbtc_holder
    
    var fees_earned_x = 0
    var fees_earned_y = 0
    var bps_ratio = 0
    var eligible_bps = 0
    var fees_on_swaps = 6 //basis points
    if (is_verified_xbtc_holder) {
      eligible_bps = 1;
      bps_ratio = eligible_bps / fees_on_swaps;
      var pct_of_btc_escrow = user_xbtc_escrowed / total_xbtc_escrowed
      fees_earned_x += total_cycle_rewards_x * bps_ratio * pct_of_btc_escrow
      fees_earned_y += total_cycle_rewards_y * bps_ratio * pct_of_btc_escrow

    }
    if (is_lp) {
      eligible_bps = 3
      bps_ratio = eligible_bps / fees_on_swaps;
      var pct_of_lp_staked = user_lp_staked / total_lp_staked
      fees_earned_x += total_cycle_rewards_x * bps_ratio * pct_of_lp_staked
      fees_earned_y += total_cycle_rewards_y * bps_ratio * pct_of_lp_staked

    }
    if (is_both) {
      eligible_bps = 1
      bps_ratio = eligible_bps / fees_on_swaps;
      var pct_of_lp_staked = user_lp_staked / total_lp_staked
      fees_earned_x += total_cycle_rewards_x * bps_ratio * pct_of_lp_staked
      fees_earned_y += total_cycle_rewards_y * bps_ratio * pct_of_lp_staked
    }
    
    // if (claimed) {
    //   //resets to 0 if already claimed the rewards
    //   fees_earned_x = 0;
    //   fees_earned_y = 0;
    // }

    console.log("claimable_fees_x: ", fees_earned_x)
    console.log("claimable_fees_y: ", fees_earned_y)
    this.token_x_rewards = fees_earned_x;
    this.token_y_rewards = fees_earned_y;

  }

  async viewTotalRewardsAtCycle() {
    this.getCurrentCycle()
    var cycleNum = this.cycleClaimNumber;
    var token_x = this.usdaContract;
    var token_y = this.xusdContract;
    this.token_x_symbol = "USDA";
    this.token_y_symbol = "xUSD";
    var token_x_decimals = 1e6;
    var token_y_decimals = 1e6;

    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var options = {
      network: this.network,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'get-total-cycle-fees',
      functionArgs: [token_x, token_y, uintCV(cycleNum)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    console.log(result);
    console.log(result.type);
    this.clickedSearch = true;
    console.log(cvToValue(result));
    var output = cvToValue(result);
    console.log(output[0]);
    console.log(typeof(output));
    console.log(output['token-x-bal'].value)
    console.log(output['token-y-bal'].value)
    var token_x_rewards = output['token-x-bal'].value / token_x_decimals
    var token_y_rewards = output['token-y-bal'].value / token_y_decimals
    return [token_x_rewards, token_y_rewards]
  }

  async getTotalLPStakedByUserAtCycle() {
    var cycleNum = this.cycleClaimNumber;
    var token_x = this.usdaContract;
    var token_y = this.xusdContract;
    var token_x_decimals = 1e6;
    var token_y_decimals = 1e6;

    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var options = {
      network: this.network,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'get-lp-staked-by-user-at-cycle',
      functionArgs: [token_x, token_y, uintCV(cycleNum), standardPrincipalCV(txSenderAddress)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    console.log(result);
    // console.log(result.type);
    this.clickedSearch = true;
    console.log(cvToValue(result));
    var output = cvToValue(result);
    var lp_staked = output['lp-staked'].value
    var claimed = output['reward-claimed'].value
    console.log("lp_staked: ",lp_staked, "claimed: ", claimed)
    return [lp_staked, claimed]

  }

  async getTotalLPStakedAtCycle() {
    var cycleNum = this.cycleClaimNumber;
    var token_x = this.usdaContract;
    var token_y = this.xusdContract;
    var token_x_decimals = 1e6;
    var token_y_decimals = 1e6;

    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var options = {
      network: this.network,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'get-total-lp-staked-at-cycle',
      functionArgs: [token_x, token_y, uintCV(cycleNum)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    var output = cvToValue(result);
    var total_lp_staked = output['total-lp-staked'].value
    console.log("toal_lp_staked: ",total_lp_staked)
    return total_lp_staked
  }

  async getTotalXBTCEscrowedByUserAtCycle() {
    var cycleNum = this.cycleClaimNumber;
    var token_x = this.usdaContract;
    var token_y = this.xusdContract;
    var token_x_decimals = 1e6;
    var token_y_decimals = 1e6;

    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var options = {
      network: this.network,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'get-user-xbtc-escrowed-at-cycle',
      functionArgs: [standardPrincipalCV(txSenderAddress), uintCV(cycleNum)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    console.log(result);
    // console.log(result.type);
    this.clickedSearch = true;
    console.log(cvToValue(result));
    var output = cvToValue(result);
    var user_xbtc_escrowed = output['amount'].value
    console.log("toal_xbtc_escrowed: ",user_xbtc_escrowed)
    return user_xbtc_escrowed

  }

  async getTotalXBTCEscrowedAtCycle() {
    var cycleNum = this.cycleClaimNumber;
    var token_x = this.usdaContract;
    var token_y = this.xusdContract;
    var token_x_decimals = 1e6;
    var token_y_decimals = 1e6;

    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var options = {
      network: this.network,
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap',
      functionName: 'get-total-xbtc-escrowed-at-cycle',
      functionArgs: [uintCV(cycleNum)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    var output = cvToValue(result);
    var toal_xbtc_escrowed = output['amount'].value
    console.log("toal_xbtc_escrowed: ",toal_xbtc_escrowed)
    return toal_xbtc_escrowed
  }

}
