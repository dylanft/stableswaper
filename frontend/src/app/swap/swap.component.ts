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
  cvToValue
} from '@stacks/transactions';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
import { userSession } from 'src/stacksUserSession';


@Component({
  selector: 'token-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.css']
})
export class SwapComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    if (this.network.isMainnet()) {
      this.txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(this.txSenderAddress)
    }
    else {
      this.txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }
    this.getUsersTokenBalance('USDA', 1e6).then((x) => this.usdaBalance = x);
    this.getUsersTokenBalance('xUSD', 1e6).then((x) => this.xusdBalance = x);
    this.getUsersTokenBalance('xBTC', 1).then((x) => this.xbtcBalance = x);
    this.getUsersTokenBalance('usd-lp', 1e6).then((x) => this.usdlpBalance = x);
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
    createLPString('xusd-token')
  );


  public userSession = userSession;
  usdaBalance: string | null = null;
  xusdBalance: string | null = null;
  xbtcBalance: string | null = null;
  usdlpBalance: string | null = null;

  swapXforY(tokenX: string, tokenY: string, x: number, y: number) {
    x = x*1e6;
    y= y*1e6;
    console.log("tokenX: ", tokenX, "tokenY: ", tokenY)
    if (tokenX == 'USDA' && tokenY=='xUSD') {
      var tX = this.usdaContract;
      var tY = this.xusdContract;
      var fname = 'swap-x-for-y';
      var createPoolPC1 = makeStandardFungiblePostCondition(
        this.txSenderAddress,
        FungibleConditionCode.Equal,
        x,
        createAssetInfo(this.deployerAddress, 'usda-token', 'usda')
      )
      var createPoolPC2 = makeContractFungiblePostCondition(
        this.deployerAddress,
        'stableswap-v3',
        FungibleConditionCode.GreaterEqual,
        y,
        createAssetInfo(this.deployerAddress, 'xusd-token', 'xusd') 
      )
    }
    else { //(tokenX == 'xUSD' && tokenY=='USDA')
      var tX = this.xusdContract;
      var tY = this.usdaContract;
      var fname = 'swap-y-for-x'
      var createPoolPC1 = makeStandardFungiblePostCondition(
        this.txSenderAddress,
        FungibleConditionCode.Equal,
        x,
        createAssetInfo(this.deployerAddress, 'xusd-token', 'xusd')
      )
      var createPoolPC2 = makeContractFungiblePostCondition(
        this.deployerAddress,
        'stableswap-v3',
        FungibleConditionCode.GreaterEqual,
        y,
        createAssetInfo(this.deployerAddress, 'usda-token', 'usda') 
      )
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
    if (tokenAorB == "A") {
      this.tokenA = event.value;
      console.log("tokenA: ", this.tokenA);
    }
    else if (tokenAorB == "B") {
      this.tokenB = event.value;
      console.log("tokenB: ", this.tokenB);
    }
  }

  printTokenAmount(val: string) {
    //TODO: update this function to grab price of this # of stablecoins in real dollars based on AMM
    //TODO: display output below the amount entered in the text field
    console.log(val)
  }

  updateTokenAmount(val: string, tokenType: string) {
    console.log(val)
    if (tokenType == "A") {
      this.tokenA_amt = parseInt(val);
      console.log("tokenA: ", this.tokenA_amt);
    }
    else if (tokenType == "B") {
      this.tokenB_amt = parseInt(val);
      console.log("tokenB: ", this.tokenB_amt);
    }
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
