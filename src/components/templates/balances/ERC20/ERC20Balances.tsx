import { useState, useEffect } from 'react';
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
import { useNetwork, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from 'wagmi';
import abi from '../../../../../contract/abi.json';
import { parseEther } from 'ethers/lib/utils.js';

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
  }

  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { data: session } = useSession();
  const { chain } = useNetwork();

  const availableChains = [
    { chainName: 'Ethereum', chainId: 5, distributionContractAddr: '0x1698f20D6597A48df6E4571a69C58eE741B29ed1' },
    { chainName: 'Polygon', chainId: 80001, distributionContractAddr: '0xB6DE251e07D116EeDaF3Bf68E805C72DA23B62cc' },
    { chainName: 'Avalanche', chainId: 43114, distributionContractAddr: '0x8057746C51Ce81e7271d61e289A17DA2bf5389cB' },
  ];

  const [queriedChain, setQueriedChain] = useState({ chainName: '', chainId: chain?.id });
  const [selectedDestChain, setSelectedDestChain] = useState<DestChain[]>([]);
  const [receiverAddrs, setReceiverAddrs] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<SelectedToken[]>([]);

  const [submittedDestChain, setSubmittedDestChain] = useState<DestChain[]>([]);
  const [submittedToken, setSubmittedToken] = useState<SelectedToken[]>([]);
  const [submittedReceiverAddrs, setSubmittedReceiverAddrs] = useState<string[]>([]);
  const [sourceChainContractAddr, setSourceChainContractAddr] = useState('');

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
    if (chain) setQueriedChain({ ...queriedChain, chainName: chain.name });
    if (chain?.id === 5) setSourceChainContractAddr(availableChains[0].distributionContractAddr);
    if (chain?.id === 80001) setSourceChainContractAddr(availableChains[1].distributionContractAddr);
    if (chain?.id === 43114) setSourceChainContractAddr(availableChains[2].distributionContractAddr);
  }, [chain]);

  const updateReceiverAddrs = (index: number, value: string) => {
    const updatedList = [...receiverAddrs];
    updatedList[index] = value;
    setReceiverAddrs(updatedList);
    parseForSubmission();
  };

  const updateTransferAmount = (index: number, tokenSymbol: string, tokenAddr: string, transferAmount: number) => {
    const updatedList = [...selectedToken];
    updatedList[index] = { tokenSymbol, tokenAddr, transferAmount };
    setSelectedToken(updatedList);
    parseForSubmission();
  };

  const updateDestChain = (index: number, chainName: string, chainId: number, distributionContractAddr: string) => {
    const updatedList = [...selectedDestChain];
    updatedList[index] = { chainName, chainId, distributionContractAddr };
    setSelectedDestChain(updatedList);
    parseForSubmission();
  };

  const parseForSubmission = () => {
    setSubmittedDestChain(selectedDestChain.filter((item) => !(item.chainName === '' && item.chainId === 0)));
    setSubmittedToken(selectedToken.filter((item) => !(item === undefined)));
    setSubmittedReceiverAddrs(receiverAddrs.filter((item) => !(item === '')));
  };

  const { config } = usePrepareContractWrite({
    address: sourceChainContractAddr,
    abi: abi,
    chainId: selectedDestChain[0]?.chainId,
    functionName: 'sendToMany(string,string,address[],string,uint256)',
    args: [
      submittedDestChain[0]?.chainName,
      submittedDestChain[0]?.distributionContractAddr,
      submittedReceiverAddrs,
      submittedToken[0]?.tokenSymbol,
      submittedToken[0]?.transferAmount,
    ],
    overrides: {
      value: parseEther('1'),
    },
    enabled: true,
  });

  const { write } = useContractWrite(config);

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        ERC20 Balances
      </Heading>
      <Menu>
        {({ isOpen }) => (
          <>
            <MenuButton isActive={isOpen} as={Button} rightIcon={<ChevronDownIcon />}>
              {queriedChain?.chainName}
            </MenuButton>
            <MenuList>
              {availableChains.map((chain) => (
                <MenuItem
                  key={chain.chainId}
                  onClick={() => setQueriedChain({ chainName: chain.chainName, chainId: chain.chainId })}
                >
                  {chain.chainName}
                </MenuItem>
              ))}
            </MenuList>
          </>
        )}
      </Menu>
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
                        <Menu>
                          {({ isOpen }) => (
                            <>
                              <MenuButton isActive={isOpen} as={Button} size="s" rightIcon={<ChevronDownIcon />}>
                                {selectedDestChain[key]?.chainName == ''
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
                            const value = e.target.value;
                            if (key !== undefined && token?.symbol && token?.contractAddress) {
                              updateTransferAmount(
                                key,
                                token.symbol,
                                token.contractAddress.checksum,
                                parseFloat(value),
                              );
                            }
                          }}
                        />
                        <Button disabled={!write} onClick={() => write?.()}>
                          Transfer
                        </Button>
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
