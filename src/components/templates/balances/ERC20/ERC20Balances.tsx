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
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useEvmWalletTokenBalances } from '@moralisweb3/next';
import { useSession } from 'next-auth/react';
import { getEllipsisTxt } from 'utils/format';
import { useNetwork } from 'wagmi';
import { useState, useEffect } from 'react';

const ERC20Balances = () => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { data } = useSession();
  const { chain } = useNetwork();
  const [queriedChain, setQueriedChain] = useState({ chainName: '', chainId: chain?.id });

  const { data: tokenBalances } = useEvmWalletTokenBalances({
    address: data?.user?.address,
    chain: queriedChain.chainId,
  });

  useEffect(() => {
    if (chain) setQueriedChain({ ...queriedChain, chainName: chain.name });
  }, [chain]);

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
              <MenuItem onClick={() => setQueriedChain({ chainName: 'Ethereum', chainId: 5 })}>Ethereum</MenuItem>
              {/* fix avalanche */}
              <MenuItem onClick={() => setQueriedChain({ chainName: 'Avalanche', chainId: 43113 })}>Avalanche</MenuItem>
              <MenuItem onClick={() => setQueriedChain({ chainName: 'Polygon', chainId: 80001 })}>Polygon</MenuItem>
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
                  <Th>Transfer To</Th>
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
                        <Text as={'span'}>Belz</Text>
                        <Text as={'span'}>Petruska</Text>
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
