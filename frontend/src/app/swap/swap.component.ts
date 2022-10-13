import { Component, OnInit } from '@angular/core';
import { openContractCall } from '@stacks/connect';
import { StacksMocknet, StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
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
}
