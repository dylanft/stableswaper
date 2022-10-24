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
  cvToValue,
} from '@stacks/transactions';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
import { userSession } from 'src/stacksUserSession';

@Component({
  selector: 'token-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.css'],
})
export class SwapComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    if (this.network.isMainnet()) {
      this.txSenderAddress =
        userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(this.txSenderAddress);
    } else {
      this.txSenderAddress =
        userSession.loadUserData().profile.stxAddress.testnet;
    }
    this.getUsersTokenBalance('USDA', 1e6).then((x) => (this.usdaBalance = x));
    this.getUsersTokenBalance('xUSD', 1e6).then((x) => (this.xusdBalance = x));
    this.getUsersTokenBalance('xBTC', 1).then((x) => (this.xbtcBalance = x));
    this.getUsersTokenBalance('usd-lp', 1e6).then(
      (x) => (this.usdlpBalance = x)
    );
  }
  tokenList: any[] = ['USDA', 'xUSD'];
  deployerAddress: string = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';

  tokenA: string = '';
  tokenB: string = '';
  tokenA_amt: number = 0;
  tokenB_amt: number = 0;
  txSenderAddress: any;

  network: any = new StacksTestnet();
  usdaContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress('ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'),
    createLPString('usda-token')
  );

  xusdContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress('ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'),
    createLPString('xusd-v2')
  );

  public userSession = userSession;
  usdaBalance: string | null = null;
  xusdBalance: string | null = null;
  xbtcBalance: string | null = null;
  usdlpBalance: string | null = null;

  usdaPoolBalance: number = 1;
  xusdPoolBalance: number = 1;
  slippageFactor: number = 5; // 5%

  swapXforY(tokenX: string, tokenY: string, x: number, y: number) {
    x = x * 1e6;
    y = y * 1e6;
    console.log('tokenX: ', tokenX, 'tokenY: ', tokenY);
    if (tokenX == 'USDA' && tokenY == 'xUSD') {
      var tX = this.usdaContract;
      var tY = this.xusdContract;
      var fname = 'swap-x-for-y';
      var createPoolPC1 = makeStandardFungiblePostCondition(
        this.txSenderAddress,
        FungibleConditionCode.Equal,
        x,
        createAssetInfo(this.deployerAddress, 'usda-token', 'usda')
      );
      var createPoolPC2 = makeContractFungiblePostCondition(
        this.deployerAddress,
        'stableswap-v3',
        FungibleConditionCode.GreaterEqual,
        y,
        createAssetInfo(this.deployerAddress, 'xusd-v2', 'xusd')
      );
    } else {
      //(tokenX == 'xUSD' && tokenY=='USDA')
      var tX = this.xusdContract;
      var tY = this.usdaContract;
      var fname = 'swap-y-for-x';
      var createPoolPC1 = makeStandardFungiblePostCondition(
        this.txSenderAddress,
        FungibleConditionCode.Equal,
        x,
        createAssetInfo(this.deployerAddress, 'xusd-v2', 'xusd')
      );
      var createPoolPC2 = makeContractFungiblePostCondition(
        this.deployerAddress,
        'stableswap-v3',
        FungibleConditionCode.GreaterEqual,
        y,
        createAssetInfo(this.deployerAddress, 'usda-token', 'usda')
      );
    }
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW',
      contractName: 'stableswap-v3',
      functionName: fname,
      functionArgs: [tX, tY, uintCV(x), uintCV(y)],
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

  selectToken(event: any, tokenAorB: string) {
    // console.log("event: ", event)
    // console.log("event.value: ", event.value)

    if (tokenAorB == 'A') {
      this.tokenA = event.value;
      console.log('tokenA: ', this.tokenA);
    } 
    else if (tokenAorB == 'B') {
      this.tokenB = event.value;
      console.log('tokenB: ', this.tokenB);
    }

    if (this.tokenA != '' && this.tokenB != '') {
      this.updateTokenAmount(this.tokenA_amt.toString(), 'A')
    }
  }

  printTokenAmount(val: string) {
    //TODO: update this function to grab price of this # of stablecoins in real dollars based on AMM
    //TODO: display output below the amount entered in the text field
    console.log(val);
  }

  updateTokenAmount(val: string, tokenType: string) {
    // var usdaBalance, xusdBalance =  this.getTokensInPool();
    this.getTokensInPool().then(res => {
      this.usdaPoolBalance = res[0];
      this.xusdPoolBalance = res[1];
    })
    console.log(this.usdaPoolBalance, this.xusdPoolBalance);

    if (tokenType == 'A') {
      this.tokenA_amt = parseInt(val);
      console.log('tokenA: ', this.tokenA_amt);
      if (this.tokenA == 'USDA' && this.tokenB == 'xUSD') {
        // set xusd price based on pool ratio
        this.tokenB_amt = this.tokenA_amt * this.xusdPoolBalance / this.usdaPoolBalance;
        this.tokenB_amt = this.naiveRound(this.tokenB_amt - (this.tokenB_amt * this.slippageFactor / 100),2);
      }
      else if (this.tokenA == 'xUSD' && this.tokenB == 'USDA') {
        // set usda price based on pool ratio
        this.tokenB_amt = this.tokenA_amt * this.usdaPoolBalance / this.xusdPoolBalance;
        this.tokenB_amt = this.naiveRound(this.tokenB_amt - (this.tokenB_amt * this.slippageFactor / 100), 2);
      }

      //TODO: make token B amount reflect based on current price. should not be an input (unless user wants)
    } else if (tokenType == 'B') {
      this.tokenB_amt = parseInt(val);
      console.log('tokenB: ', this.tokenB_amt);
      if (this.tokenB == 'USDA' && this.tokenA == 'xUSD') {
        // set xusd price based on pool ratio
        this.tokenA_amt = this.tokenB_amt * this.xusdPoolBalance / this.usdaPoolBalance;
        this.tokenA_amt = this.naiveRound(this.tokenA_amt / (1 - (this.slippageFactor / 100)), 2);
      }
      else if (this.tokenB == 'xUSD' && this.tokenA == 'USDA') { 
        // set usda price based on pool ratio
        this.tokenA_amt = this.tokenB_amt * this.usdaPoolBalance / this.xusdPoolBalance;
        this.tokenA_amt = this.naiveRound(this.tokenA_amt / (1 - (this.slippageFactor / 100)), 2);
      }

    }
  }

  async getTokensInPool() {
    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress);
    } else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
    var contractName = 'stableswap-v3'

    var usdaOptions = {
      network: this.network,
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-total-supply-x',
      functionArgs: [this.usdaContract, this.xusdContract],
      senderAddress: txSenderAddress,
    };
    const usdaResult = await callReadOnlyFunction(usdaOptions);
    var usdaOutput = cvToValue(usdaResult);

    var xusdOptions = {
      network: this.network,
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-total-supply-y',
      functionArgs: [this.usdaContract, this.xusdContract],
      senderAddress: txSenderAddress,
    };
    const xusdResult = await callReadOnlyFunction(xusdOptions);
    var xusdOutput = cvToValue(xusdResult);
    console.log(usdaOutput.value, xusdOutput.value)
    let output : number[];
    output = [usdaOutput.value, xusdOutput.value]
    return output;
  }

  async getUsersTokenBalance(token: string, decimalFactor: number) {
    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress);
    } else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    if (token == 'USDA') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
      var contractName = 'usda-token';
    } else if (token == 'xUSD') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
      var contractName = 'xusd-v2';
    } else if (token == 'xBTC') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
      var contractName = 'xbtc-token';
    } else if (token == 'usd-lp') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
      var contractName = 'usd-lp';
    } else {
      var contractAddress = '';
      var contractName = '';
      console.log(token + ' balance lookup not included with app code');
    }

    var options = {
      network: this.network,
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-balance',
      functionArgs: [principalCV(txSenderAddress)],
      senderAddress: txSenderAddress,
    };
    const result = await callReadOnlyFunction(options);
    var output = cvToValue(result);
    return this.numberWithCommas(output.value, decimalFactor);
  }

  numberWithCommas(n: number, uintDecimalFactor: number) {
    var n_str = (n / uintDecimalFactor).toString();
    var x = Number(parseFloat(n_str)).toFixed(2);
    var parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  naiveRound(n: number, decimalPlaces: number = 0) {
    var p = Math.pow(10, decimalPlaces);
    return Math.round(n * p) / p;
  }
}
