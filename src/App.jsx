import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  Stack,
  Text,
  Wrap,
  WrapItem,
  useColorModeValue
} from "@chakra-ui/react";

const TARGETS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const YOMI = {
  10: "じゅう",
  20: "にじゅう",
  30: "さんじゅう",
  40: "よんじゅう",
  50: "ごじゅう",
  60: "ろくじゅう",
  70: "ななじゅう",
  80: "はちじゅう",
  90: "きゅうじゅう",
  100: "ひゃく"
};

const shuffleTargets = () => [...TARGETS].sort(() => Math.random() - 0.5);

const pickPreferredJaVoice = (voices) => {
  const jaVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("ja"));
  if (!jaVoices.length) return null;

  const nameHints = ["Kyoko", "Otoya", "Google", "Microsoft", "Siri", "Japanese", "Haruka", "Ichiro", "Ayumi", "Mizuki"];
  const preferred = jaVoices.find((voice) => nameHints.some((hint) => voice.name.includes(hint)));
  return preferred || jaVoices[0];
};

const Coin = ({ value, size = 46 }) => {
  const isFifty = value === 50;
  const outerGradient = isFifty ? "linear(to-b, #d5dbe2, #9099a5)" : "linear(to-b, #cc7f4f, #9f562d)";
  const ringColor = isFifty ? "#e7ebf0" : "#d89a74";

  return (
    <Flex
      w={`${size}px`}
      h={`${size}px`}
      rounded="full"
      bgGradient={outerGradient}
      borderWidth="2px"
      borderColor={isFifty ? "gray.500" : "#864b25"}
      boxShadow="inset 0 2px 4px rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.2)"
      align="center"
      justify="center"
      position="relative"
      flexShrink={0}
    >
      <Box
        w="74%"
        h="74%"
        rounded="full"
        borderWidth="2px"
        borderColor={ringColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontWeight="900" fontSize={isFifty ? "sm" : "xs"} color={isFifty ? "gray.700" : "#6a3717"}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

const CoinGroup = ({ value, count, max = 12, size = 42, perRow }) => {
  if (count <= 0) return <Text color="gray.500">0まい</Text>;

  const visibleCount = Math.min(count, max);
  const remain = count - visibleCount;
  const coinIndexes = Array.from({ length: visibleCount }, (_, idx) => idx);

  if (perRow) {
    return (
      <Grid templateColumns={`repeat(${perRow}, max-content)`} gap={2}>
        {coinIndexes.map((idx) => (
          <Coin key={`${value}-${idx}`} value={value} size={size} />
        ))}
        {remain > 0 && (
          <Flex
            h={`${size}px`}
            px={3}
            rounded="full"
            bg="white"
            borderWidth="2px"
            borderColor="brand.200"
            align="center"
            justify="center"
            fontWeight="800"
            color="brand.600"
          >
            +{remain}
          </Flex>
        )}
      </Grid>
    );
  }

  return (
    <Wrap spacing={2}>
      {coinIndexes.map((idx) => (
        <WrapItem key={`${value}-${idx}`}>
          <Coin value={value} size={size} />
        </WrapItem>
      ))}
      {remain > 0 && (
        <WrapItem>
          <Flex
            h={`${size}px`}
            px={3}
            rounded="full"
            bg="white"
            borderWidth="2px"
            borderColor="brand.200"
            align="center"
            fontWeight="800"
            color="brand.600"
          >
            +{remain}
          </Flex>
        </WrapItem>
      )}
    </Wrap>
  );
};

const GuideRow = ({ fifty, ten }) => (
  <Stack spacing={2} bg="white" p={3} rounded="xl" borderWidth="1px" borderColor="brand.100">
    <HStack spacing={3} flexWrap="wrap">
      {fifty > 0 && (
        <Text fontWeight="700" color="gray.700">
          50えんだま {fifty}まい
        </Text>
      )}
      {fifty > 0 && ten > 0 && (
        <Text fontWeight="700" color="gray.500">
          /
        </Text>
      )}
      {ten > 0 && (
        <Text fontWeight="700" color="gray.700">
          10えんだま {ten}まい
        </Text>
      )}
    </HStack>
    <HStack spacing={2} align="flex-start" flexWrap="wrap">
      {fifty > 0 && <CoinGroup value={50} count={fifty} size={34} perRow={5} />}
      {ten > 0 && <CoinGroup value={10} count={ten} size={34} perRow={5} />}
    </HStack>
  </Stack>
);

const guidePatterns = (amount) => {
  if (amount === 100) {
    return [
      { fifty: 2, ten: 0 },
      { fifty: 1, ten: 5 },
      { fifty: 0, ten: 10 }
    ];
  }

  if (amount >= 50) {
    return [
      { fifty: 1, ten: (amount - 50) / 10 },
      { fifty: 0, ten: amount / 10 }
    ];
  }

  return [{ fifty: 0, ten: amount / 10 }];
};

export default function App() {
  const [question, setQuestion] = useState(() => {
    const shuffled = shuffleTargets();
    return { target: shuffled[0], pool: shuffled.slice(1) };
  });
  const [tenCount, setTenCount] = useState(0);
  const [fiftyCount, setFiftyCount] = useState(0);
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("success");
  const target = question.target;
  const voiceRef = useRef(null);

  const total = useMemo(() => tenCount * 10 + fiftyCount * 50, [tenCount, fiftyCount]);

  const bg = useColorModeValue("brand.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const panelBg = useColorModeValue("brand.50", "gray.700");

  useEffect(() => {
    if (!window.speechSynthesis) return undefined;

    const setPreferredVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      voiceRef.current = pickPreferredJaVoice(voices);
    };

    setPreferredVoice();
    window.speechSynthesis.addEventListener("voiceschanged", setPreferredVoice);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", setPreferredVoice);
    };
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = 0.9;
    utter.pitch = 1.05;
    utter.volume = 1;

    if (voiceRef.current) {
      utter.voice = voiceRef.current;
      utter.lang = voiceRef.current.lang;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    window.speechSynthesis.speak(utter);
  };

  const clearMessage = () => setMessage("");

  const addTen = () => {
    setTenCount((n) => n + 1);
    clearMessage();
  };

  const addFifty = () => {
    setFiftyCount((n) => n + 1);
    clearMessage();
  };

  const removeTen = () => {
    setTenCount((n) => Math.max(0, n - 1));
    clearMessage();
  };

  const removeFifty = () => {
    setFiftyCount((n) => Math.max(0, n - 1));
    clearMessage();
  };

  const reset = () => {
    setTenCount(0);
    setFiftyCount(0);
    setMessageStatus("info");
    setMessage("もういちど！");
  };

  const nextQuestion = () => {
    setQuestion((prev) => {
      const source = prev.pool.length > 0 ? prev.pool : shuffleTargets();
      return { target: source[0], pool: source.slice(1) };
    });
    setTenCount(0);
    setFiftyCount(0);
    setMessage("");
  };

  const checkAnswer = () => {
    if (total === target) {
      setMessageStatus("success");
      setMessage("せいかい！ すごい！");
      speak("せいかい。すごいね。");
      window.setTimeout(nextQuestion, 1200);
      return;
    }

    if (total < target) {
      setMessageStatus("warning");
      setMessage("あと もうすこし！");
      speak("あと、もうすこし。");
      return;
    }

    setMessageStatus("info");
    setMessage("おおいよ。へらしてみよう");
    speak("おおいよ。へらしてみよう。");
  };

  return (
    <Box minH="100vh" py={{ base: 4, md: 8 }} bg={bg}>
      <Container maxW="container.lg">
        <Stack spacing={4} bg={cardBg} borderWidth="2px" borderColor="brand.200" rounded="3xl" p={{ base: 4, md: 6 }} shadow="lg">
          <Stack spacing={1} borderBottomWidth="2px" borderBottomStyle="dashed" borderColor="brand.200" pb={4}>
            <Heading color="brand.500" fontSize={{ base: "3xl", md: "5xl" }}>
              おかねの かぞえかた
            </Heading>
            <Text color="brand.600" fontWeight="700" fontSize={{ base: "xl", md: "2xl" }}>
              10えん ~ 100えん まで
            </Text>
          </Stack>

          <Box bg={panelBg} borderWidth="2px" borderColor="brand.200" rounded="2xl" p={{ base: 4, md: 5 }}>
            <Flex direction={{ base: "column", md: "row" }} gap={3} align={{ md: "center" }}>
              <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="800">
                おだい: <Text as="span">{target}</Text> えん を つくろう！
              </Text>
            </Flex>

            <Grid mt={4} gap={3} templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }}>
              <Button onClick={addTen} size="lg" h="64px" fontSize={{ base: "2xl", md: "2xl" }} colorScheme="brand" variant="solid" _active={{ transform: "scale(0.98)" }}>
                +10 えん
              </Button>
              <Button onClick={addFifty} size="lg" h="64px" fontSize={{ base: "2xl", md: "2xl" }} colorScheme="brand" variant="solid" _active={{ transform: "scale(0.98)" }}>
                +50 えん
              </Button>
              <Button onClick={removeTen} isDisabled={tenCount === 0} size="lg" h="64px" fontSize={{ base: "2xl", md: "2xl" }} colorScheme="brand" variant="outline" _active={{ transform: "scale(0.98)" }}>
                -10 えん
              </Button>
              <Button onClick={removeFifty} isDisabled={fiftyCount === 0} size="lg" h="64px" fontSize={{ base: "2xl", md: "2xl" }} colorScheme="brand" variant="outline" _active={{ transform: "scale(0.98)" }}>
                -50 えん
              </Button>
            </Grid>

            <HStack justify="center" mt={4} spacing={3} flexWrap="wrap">
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700" color="gray.600">
                10えん: {tenCount}まい
              </Text>
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700" color="gray.600">
                /
              </Text>
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="700" color="gray.600">
                50えん: {fiftyCount}まい
              </Text>
            </HStack>

            <Stack mt={4} spacing={3} bg="whiteAlpha.800" p={3} rounded="xl" borderWidth="1px" borderColor="brand.100">
              <Text align="center" fontWeight="800" color="brand.600" fontSize={{ base: "lg", md: "xl" }}>
                いま つかった こうか
              </Text>
              <HStack align="center" spacing={3}>
                <Text minW="90px" fontWeight="700" color="gray.700">
                  50えん:
                </Text>
                <CoinGroup value={50} count={fiftyCount} />
              </HStack>
              <HStack align="center" spacing={3}>
                <Text minW="90px" fontWeight="700" color="gray.700">
                  10えん:
                </Text>
                <CoinGroup value={10} count={tenCount} />
              </HStack>
            </Stack>

            <Text mt={2} align="center" fontSize={{ base: "md", md: "xl" }} fontWeight="700" color="brand.600">
              ヒント: 50えん だま は 10えん だま 5まい と おなじ
            </Text>

            {message && (
              <Alert status={messageStatus} mt={4} rounded="xl" fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" justifyContent="center">
                <AlertIcon />
                {message}
              </Alert>
            )}

            <Flex justify="center" mt={4}>
              <Badge colorScheme="brand" px={5} py={2} rounded="xl" fontSize={{ base: "2xl", md: "3xl" }}>
                ごうけい: {total} えん
              </Badge>
            </Flex>

            <Grid mt={4} pt={2} gap={3} templateColumns={{ base: "1fr", md: "1fr 1fr" }}>
              <Button onClick={checkAnswer} colorScheme="brand" size="lg" h="64px" fontSize="2xl">
                こたえあわせ
              </Button>
              <Button onClick={reset} colorScheme="brand" variant="outline" size="lg" h="64px" fontSize="2xl">
                やりなおし
              </Button>
            </Grid>
          </Box>

          <Divider borderColor="brand.200" />

          <Stack spacing={3}>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="brand.600">
              おてほん: 10えん から 100えん
            </Text>
            {TARGETS.map((amount) => (
              <Box key={amount} bg={panelBg} borderWidth="2px" borderColor="brand.200" rounded="2xl" p={{ base: 3, md: 4 }}>
                <Flex direction={{ base: "column", md: "row" }} gap={3} align={{ md: "center" }}>
                  <Box minW={{ md: "140px" }}>
                    <Text color="gray.600" fontWeight="700" fontSize={{ base: "sm", md: "md" }}>
                      {YOMI[amount]}
                    </Text>
                    <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="900" color="gray.800">
                      {amount}えん
                    </Text>
                  </Box>
                  <Stack spacing={2} flex="1">
                    {guidePatterns(amount).map((pattern, idx) => (
                      <GuideRow key={`${amount}-${idx}`} fifty={pattern.fifty} ten={pattern.ten} />
                    ))}
                  </Stack>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
