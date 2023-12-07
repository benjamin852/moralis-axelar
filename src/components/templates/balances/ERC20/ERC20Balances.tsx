import { useState, useEffect, useRef } from 'react';
import {
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tfoot,
  VStack,
  Heading,
  Box,
  Text,
  Avatar,
  HStack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Input,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useEvmWalletTokenBalances } from '@moralisweb3/next';
import { useSession } from 'next-auth/react';
import { getEllipsisTxt } from 'utils/format';
import { useNetwork, usePrepareContractWrite, useContractWrite } from 'wagmi';
import abi from '../../../../../contract/abi.json';
import { parseEther, parseUnits } from 'ethers/lib/utils.js';

const ERC20Balances = () => {
  interface DestChain {
    chainName: string;
    chainId: number;
    distributionContractAddr: string;
  }

  interface SelectedToken {
    tokenSymbol: string;
    tokenAddr: string;
    transferAmount: number;
    pendingTx: boolean;
  }

  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { data: session } = useSession();
  const { chain } = useNetwork();

  const availableChains = [
    { chainName: 'ethereum-2', chainId: 5, distributionContractAddr: '0x69644bbdb828fc3e5b4FF342DA79D27F21431099' },
    { chainName: 'Polygon', chainId: 80001, distributionContractAddr: '0x423F37209e3e2F161F9Bdadc6fFD7073fA8d2a59' },
  ];

  const [sourceChainContractAddr, setSourceChainContractAddr] = useState('');
  const [selectedDestChain, setSelectedDestChain] = useState<DestChain[]>([]);
  const [receiverAddrs, setReceiverAddrs] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<SelectedToken[]>([]);

  const [submittedDestChain, setSubmittedDestChain] = useState<DestChain[]>([]);
  const [submittedToken, setSubmittedToken] = useState<SelectedToken[]>([]);
  const [submittedReceiverAddrs, setSubmittedReceiverAddrs] = useState<string[]>([]);

  const keyRef = useRef<number | null>(null);

  const { data: tokenBalances } = useEvmWalletTokenBalances({
    address: session?.user?.address,
    chain: chain?.id,
  });

  useEffect(() => {
    if (tokenBalances) {
      setReceiverAddrs(new Array(tokenBalances.length).fill(''));
      setSelectedDestChain(
        new Array(tokenBalances.length).fill({ chainName: '', chainId: 0, distributionContractAddr: '' }),
      );
    }
  }, [tokenBalances]);

  useEffect(() => {
    if (chain?.id === 5) setSourceChainContractAddr(availableChains[0].distributionContractAddr);
    if (chain?.id === 80001) setSourceChainContractAddr(availableChains[1].distributionContractAddr);
    if (chain?.id === 43114) setSourceChainContractAddr(availableChains[2].distributionContractAddr);
  }, [chain]);

  useEffect(() => {
    const filteredDestChain = selectedDestChain.filter((item) => !(item.chainName === '' && item.chainId === 0));
    setSubmittedDestChain(filteredDestChain);

    const filteredTokens = selectedToken.filter((item) => !(item === undefined));
    setSubmittedToken(filteredTokens);

    const filteredReceiverAddrs = receiverAddrs
      .filter((item) => !(item === ''))
      .flatMap((item) => item.split(','))
      .map((address) => address.trim());

    setSubmittedReceiverAddrs(filteredReceiverAddrs);
  }, [selectedDestChain, selectedToken, receiverAddrs]);

  const updateReceiverAddrs = (index: number, value: string) => {
    const updatedList = [...receiverAddrs];
    updatedList[index] = value;
    setReceiverAddrs(updatedList);
  };

  const updateTransferAmount = (
    index: number,
    tokenSymbol: string,
    tokenAddr: string,
    transferAmount: number,
    pendingTx: boolean,
  ) => {
    const updatedList = [...selectedToken];
    updatedList[index] = { tokenSymbol, tokenAddr, transferAmount, pendingTx };
    setSelectedToken(updatedList);
  };

  const updateDestChain = (index: number, chainName: string, chainId: number, distributionContractAddr: string) => {
    const updatedList = [...selectedDestChain];
    updatedList[index] = { chainName, chainId, distributionContractAddr };
    setSelectedDestChain(updatedList);
  };

  const { config } = usePrepareContractWrite({
    address: sourceChainContractAddr,
    abi: abi,
    chainId: chain?.id,
    functionName: 'sendToMany(string,string,address[],string,uint256)',
    args: [
      submittedDestChain[0]?.chainName,
      submittedDestChain[0]?.distributionContractAddr,
      submittedReceiverAddrs,
      submittedToken[0]?.tokenSymbol,
      parseUnits((submittedToken[0]?.transferAmount || 0).toString(), 6).toString(),
    ],
    overrides: {
      value: parseEther('1'),
    },
  });

  const { data: txData, isSuccess, write } = useContractWrite(config);

  useEffect(() => {
    if (isSuccess) {
      setSelectedToken((prevSelectedTokens) => {
        const updatedSelectedTokens = [...prevSelectedTokens];
        const key = keyRef.current !== null ? keyRef.current : undefined;
        if (key !== undefined) {
          const { pendingTx } = updatedSelectedTokens[key];
          if (!pendingTx) {
            updatedSelectedTokens[key] = {
              ...updatedSelectedTokens[key],
              pendingTx: true,
            };
          }
          return updatedSelectedTokens;
        } else {
          return prevSelectedTokens;
        }
      });
    }
  }, [isSuccess]);

  const viewTx = () => {
    const url = `https://testnet.axelarscan.io/gmp/${txData?.hash}`;
    if (url) window.open(url, '_blank');
    setSelectedDestChain([]);
    setReceiverAddrs([]);
    setSelectedToken([]);
    setSubmittedDestChain([]);
    setSubmittedToken([]);
    setSubmittedReceiverAddrs([]);
  };

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        ERC20 Balances
      </Heading>
      {tokenBalances?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table>
              <Thead>
                <Tr>
                  <Th>Token</Th>
                  <Th>Value</Th>
                  <Th isNumeric>Address</Th>
                  <Th textAlign="center">Transfer To</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tokenBalances?.map(({ token, value }, key) => (
                  <Tr key={`${token?.symbol}-${key}-tr`} _hover={{ bgColor: hoverTrColor }} cursor="pointer">
                    <Td>
                      <HStack>
                        <Avatar size="sm" src={token?.logo || ''} name={token?.name} />
                        <VStack alignItems={'flex-start'}>
                          <Text as={'span'}>{token?.name}</Text>
                          <Text fontSize={'xs'} as={'span'}>
                            {token?.symbol}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>{value}</Td>
                    <Td isNumeric>{getEllipsisTxt(token?.contractAddress.checksum)}</Td>
                    <Td>
                      <VStack>
                        {selectedToken[key]?.pendingTx ? (
                          <Button onClick={() => viewTx()}>View Transaction</Button>
                        ) : (
                          <>
                            <Menu>
                              {({ isOpen }) => (
                                <>
                                  <MenuButton isActive={isOpen} as={Button} size="s" rightIcon={<ChevronDownIcon />}>
                                    {selectedDestChain[key]?.chainName === ''
                                      ? 'Select Chain'
                                      : selectedDestChain[key]?.chainName}
                                  </MenuButton>
                                  <MenuList>
                                    <MenuItem onClick={() => updateDestChain(key, '', 0, '')}>Clear</MenuItem>
                                    {availableChains.map((availableChain) =>
                                      availableChain.chainId !== chain?.id ? (
                                        <MenuItem
                                          key={availableChain.chainId}
                                          onClick={() =>
                                            updateDestChain(
                                              key,
                                              availableChain.chainName,
                                              availableChain.chainId,
                                              availableChain.distributionContractAddr,
                                            )
                                          }
                                        >
                                          {availableChain.chainName}
                                        </MenuItem>
                                      ) : null,
                                    )}
                                  </MenuList>
                                </>
                              )}
                            </Menu>
                            <Input
                              placeholder="Receiving Address(es)"
                              size="sm"
                              value={receiverAddrs[key] || ''}
                              onChange={(e) => updateReceiverAddrs(key, e.target.value)}
                            />
                            <Input
                              placeholder="Transfer Amount"
                              size="sm"
                              value={selectedToken[key]?.transferAmount || ''}
                              onChange={(e) => {
                                if (key !== undefined && token?.symbol && token?.contractAddress) {
                                  updateTransferAmount(
                                    key,
                                    token.symbol,
                                    token.contractAddress.checksum,
                                    parseFloat(e.target.value),
                                    false,
                                  );
                                }
                              }}
                            />
                            <Button
                              isDisabled={token?.symbol !== 'aUSDC'}
                              onClick={() => {
                                write?.();
                                keyRef.current = key;
                              }}
                            >
                              Transfer
                            </Button>
                          </>
                        )}
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
                <Tr>
                  <Th>Token</Th>
                  <Th>Value</Th>
                  <Th isNumeric>Address</Th>
                  <Th>Transfer To</Th>
                </Tr>
              </Tfoot>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box>Looks Like you do not have any ERC20 tokens</Box>
      )}
    </>
  );
};

export default ERC20Balances;
