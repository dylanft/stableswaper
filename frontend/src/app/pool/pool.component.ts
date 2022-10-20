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
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
import { userSession } from 'src/stacksUserSession';

@Component({
  selector: 'pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.css']
})
export class PoolComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.getUsersTokenBalance('USDA', 1e6).then((x) => this.usdaBalance = x);
    this.getUsersTokenBalance('xUSD', 1e6).then((x) => this.xusdBalance = x);
    this.getUsersTokenBalance('xBTC', 1).then((x) => this.xbtcBalance = x);
    this.getUsersTokenBalance('usd-lp', 1e6).then((x) => this.usdlpBalance = x);
  }
  public userSession = userSession;
  deployerAddress: string = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
  tokenList: any[] = ['USDA', 'xUSD'];
  lpTokenList: any[] = ['USDA-xUSD-LP']
  poolChoice: string = 'add';
  cycleView: string = 'cycle';
  cycleClaimNumber: number = 1;
  network: any = new StacksTestnet();
  usdaBalance: string | null = null;
  xusdBalance: string | null = null;
  xbtcBalance: string | null = null;
  usdlpBalance: string | null = null;

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
      contractAddress: 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW',
      contractName: 'stableswap-v3',
      functionName: 'add-to-position',
      functionArgs: [tx, ty, uintCV(tx_amt), uintCV(ty_amt)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [createPoolPC1, createPoolPC2],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
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
      'stableswap-v3',
      FungibleConditionCode.GreaterEqual,
      0,
      createAssetInfo(this.deployerAddress, 'usda-token', 'usda') 
    )

    var PC3 = makeContractFungiblePostCondition(
      this.deployerAddress,
      'stableswap-v3',
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
      contractAddress: 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW',
      contractName: 'stableswap-v3',
      functionName: 'reduce-position',
      functionArgs: [tx, ty, uintCV(this.withdrawalPct)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [PC1, PC2, PC3],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
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

  async getUsersTokenBalance(token: string, decimalFactor: number) {
    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    if (token == 'USDA') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'usda-token'
    } 
    else if (token == 'xUSD') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'xusd-token'
    } 
    else if (token == 'xBTC') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'xbtc-token'
    } 
    else if (token == 'usd-lp') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'usd-lp'
    } 
    else {
      var contractAddress = ''
      var contractName = ''
      console.log(token + " balance lookup not included with app code")
    } 

    var options = {
      network: this.network,
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-balance',
      functionArgs: [principalCV(txSenderAddress)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    var output = cvToValue(result);
    return this.numberWithCommas(output.value, decimalFactor);

  }

  numberWithCommas(n: number, uintDecimalFactor: number) {
    var n_str = (n / uintDecimalFactor).toString();
    var x = Number(parseFloat(n_str)).toFixed(2);
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

}
