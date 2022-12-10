import React from 'react';
import './App.css';
import { Types, AptosClient } from 'aptos';

const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

function stringToHex(text: string) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  return Array.from(encoded, (i) => i.toString(16).padStart(2, "0")).join("");
}

function App() {
  // Retrieve aptos.account on initial render and store it.
  const [address, setAddress] = React.useState<string | null>(null);
  const [account, setAccount] = React.useState<Types.AccountData | null>(null);
  const [modules, setModules] = React.useState<Types.MoveModuleBytecode[]>([]);
  const ref = React.createRef<HTMLTextAreaElement>();
  const [isSaving, setIsSaving] = React.useState(false);
  const [resources, setResources] = React.useState<Types.MoveResource[]>([]);

  React.useEffect(() => {
    // 获取钱包授权
    window.aptos!.connect()
    window.aptos.account().then(
      (data: { address: string }) => {
        //判断是否获取到钱包授权
        if (data.address === "") {
          setAddress("nil")
        } else {
          setAddress(data.address)
        }
      });
    if (!address) return;
    client.getAccount(address).then(setAccount);
    client.getAccountModules(address).then(setModules);
    client.getAccountResources(address).then(setResources);
  }, [address]);

  const hasModule = modules.some((m) => m.abi?.name === 'message');
  const publishInstructions = (
    <pre>
      Run this command to publish the module:
      <br />
      aptos move publish --package-dir /Users/uta/Develop/Project/Aptos/moves/hello_blockchain
      --named-addresses HelloBlockchain={address}
    </pre>
  );

  const resourceType = `${address}::message::MessageHolder`;
  const resource = resources.find((r) => r.type === resourceType);
  const data = resource?.data as { message: string } | undefined;
  const message = data?.message;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!ref.current) return;

    const message = ref.current.value;
    const transaction = {
      type: "entry_function_payload",
      function: `${address}::message::set_message`,
      arguments: [stringToHex(message)],
      type_arguments: [],
    };

    try {
      setIsSaving(true);
      await window.aptos.signAndSubmitTransaction(transaction);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="App">
      <p><code>{address}</code></p>
      {/* 现在，除了显示账户地址外，应用程序还会显示账户的sequence_number. 
      这sequence_number表示下一个交易序列号，以防止交易重放攻击。当您使用该帐户进行交易时，您会看到这个数字在增加。 */}
      <p><code>{account?.sequence_number}</code></p>
      {hasModule ? (
        <form onSubmit={handleSubmit}>
          <textarea ref={ref} />
          <input disabled={isSaving} type="submit" />
        </form>
      ) : publishInstructions}
      <p>{message}</p>
    </div>
  );
}

export default App;