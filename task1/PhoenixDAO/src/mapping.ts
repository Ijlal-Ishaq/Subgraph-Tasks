import { BigDecimal, BigInt, ByteArray, log } from "@graphprotocol/graph-ts";
import {
  Approval as ApprovalEvent,
  Burn as BurnEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent,
} from "../generated/PhoenixDAO/PhoenixDAO";
import {
  Approval,
  Burn,
  OwnershipTransferred,
  Transfer,
  User,
  TokenDetail,
} from "../generated/schema";

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity._owner = event.params._owner;
  entity._spender = event.params._spender;
  entity._amount = event.params._amount;
  entity.save();

  let user = User.load(entity._owner.toHexString());

  if (user) {
    user._allowanceAmount = user._allowanceAmount.plus(entity._amount);
  }
}

export function handleBurn(event: BurnEvent): void {
  let entity = new Burn(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity._burner = event.params._burner;
  entity._amount = event.params._amount;
  entity.save();

  let amount = parseInt(entity._amount.toString()) / 10 ** 18;

  let tokenDetail = TokenDetail.load("1");

  if (!tokenDetail) {
    tokenDetail = new TokenDetail("1");
    tokenDetail._totalSupply = BigInt.fromI64(110000000);
  }
  tokenDetail._totalSupply = tokenDetail._totalSupply.minus(
    BigInt.fromI64(amount as i64)
  );
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;
  entity.save();
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity._from = event.params._from;
  entity._to = event.params._to;
  entity._amount = event.params._amount;
  entity.timestamp = event.block.timestamp;
  entity.save();

  let sender = User.load(entity._from.toHexString());
  let receiver = User.load(entity._to.toHexString());

  let tokenDetail = TokenDetail.load("1");

  if (!tokenDetail) {
    tokenDetail = new TokenDetail("1");
    tokenDetail._totalSupply = BigInt.fromI64(110000000);
  }

  if (!sender) {
    sender = new User(entity._from.toHexString());
    tokenDetail._holders = tokenDetail._holders.plus(BigInt.fromI32(1));
  }

  if (entity._amount) {
    sender._balance = sender._balance.minus(entity._amount);
    if (
      sender._balance.le(BigInt.zero()) &&
      sender.id.toString().toLowerCase() !=
        "0xf8d5a45c4b5fe0e56e51e00f84b29ab9b9fd9f8b".toLowerCase()
    ) {
      tokenDetail._holders = tokenDetail._holders.minus(BigInt.fromI32(1));
    }
  }

  if (!receiver) {
    receiver = new User(entity._to.toHexString());
    tokenDetail._holders = tokenDetail._holders.plus(BigInt.fromI32(1));
  } else if (
    receiver._balance.le(BigInt.zero()) &&
    receiver.id.toString().toLowerCase() !=
      "0xf8d5a45c4b5fe0e56e51e00f84b29ab9b9fd9f8b".toLowerCase()
  ) {
    tokenDetail._holders = tokenDetail._holders.plus(BigInt.fromI32(1));
  }

  if (entity._amount) {
    receiver._balance = receiver._balance.plus(entity._amount);
  }

  tokenDetail.save();
  sender.save();
  receiver.save();
}
