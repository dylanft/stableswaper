import { Component, OnInit } from '@angular/core';
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
  FungibleConditionCode,
  intCV,
  makeContractFungiblePostCondition,
  makeStandardFungiblePostCondition,
  makeStandardSTXPostCondition,
  PostConditionMode,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
} from '@stacks/transactions';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
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
  poolChoice: string = 'add';
  cycleView: string = 'cycle';
  cycleClaimNumber: number = 1;
  network: any = new StacksMocknet();


  tokenA: string = '';
  tokenB: string = '';
  tokenA_amt: number = 0;
  tokenB_amt: number = 0;


  lpToken: string = '';
  lpToken_amt_user: number = 0;
  lpToken_amt_user_earn: number = 0;
  lpToken_amt_user_pool: number = 0;
  lpToken_amt_total: number = 0;
  withdrawalPct: number = 100;

  lpTokenContractName: string = '';
  lpTokenAssetName: string = '';

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
    else if (tokenType == "LP") {
      this.lpToken = event.value;
      if (this.lpToken == 'USDA-xUSD-LP') {
        this.lpTokenContractName = 'usd-lp';
        this.lpTokenAssetName = 'usd-lp';
      }
      console.log("LP Token: ", this.lpToken);
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

  stakeLiquidityPoolTokens() {
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
      FungibleConditionCode.GreaterEqual,
      amountLPtokens,
      createAssetInfo(this.deployerAddress, this.lpTokenContractName, this.lpTokenAssetName)
      
    )

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
    console.log(result);
  }
}
