import fs from "fs";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import Download, { EVENTS } from "./download";

const TEST_HANDLE =
  "testfile7f024ff384bbeeecd959bd8dcd9306cf2fae397853a2c2e85866f28cb55187952kCPiaAU";

test("Download.toBlob emits the expected events", done => {
  const mock = new MockAdapter(axios);
  const mockIotaHeader = {
    "content-type": "application/json"
  };

  const mockPollResponse1 = {
    ixi: {
      signatures: [
        "999999A9XHOCBG9GLICCGAJBKDGCGBS9EIFENCWCFE9AKDKEQAEIJ9BIKBKFMHVDGHGCIGHCVHGBMFECCCZCXGNAFFTCLDRFVD9BQFTFNAUGH9HFYDXHACQBFHX9DGJER9RF9DOHNEU9LEEBOEV9EEXEKHSCWEJFYHAAWDHHSHWGI9MDR9KGZCOG9IFIK9A9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"
      ]
    },
    duration: 0
  };

  const mockPollResponse2 = {
    ixi: {
      signatures: [
        "S9RHHBBCSCNGRCNB9AY9BCHEMCV9ZHJITHZEOBNGTDEIC9BE9HJAWFEFICNFADCGWDCFSAEGGEKCPDZEHEOAKDVAJCVACBYDXGZBDADCWBACQHKAHASDEVJJSGOANJCGEYEQPJWVLNOHCFJDDDOKNUUGLQYESNLHGEOZATEOCWUGVLMZSXZUPJBDZDTJFBGCRJNJI9LIZXJSAJVUCLVEXBSIHSVTX9D9KIIYTSSTCKDZBY9QKD9XRWZUASITAXJMUPPQOVO9WZNYNBPMZPNSJOMEPYFUEXATGAULDAVYKE9CQAQNZOBQFUUFWKMU9DOYUQQJOYOCLECHMETFHAVUTVHPWXIHYX99TAFPVEMXDZNRPXEZKGOXNXGJPKSCFFGIKLVSFWONMUHMJEJVFSRCYMACAMUVLNJPDQRGWNKFE9XNPGKYUBPARFBBPFYOFHT9DLRQPDADWIVJXEBETBQTQAMOXIQWJSVUTBXLIHBF9VHHJABPY9KTHHGBF9OMATPGZSLLBSVRQKFBBPYQRIBXDKBZN9YDPCZDXGDNKJBETTBOECQPHERZZSGDALABJLCPW9ZWEYS9ZYTKQHNTZQCIJMCWJXSVMXUPQRTPNXBVEBYFXAHBRWEUTJOUNDM9TKVCCEMWHJ9PXSWIMYHJMLSBXCKDRUCXEHHLWUQQUTSDVVKVKZBIZTOESQOWRVJZVDLXFKSZQONXPLCVZRSLUXLWMPNILK9YIPBHDNIGDCLZSBQJRJWPNXNKWTENXZQQWKIIVBOLCCXKOQWZZNIYUYNQVDXJLJJLTJHEAEILNETRWYTZOKYSFTMAPSTKNDM9OYCRZRTLSGB9DE9DQJROTMYFIETIHIGJI9VXJOGSTZN9LNWWMRKIET9DUPSRIAWCDOVPTBXILPY9ZDGSBKZJHVLSRSFWQZMXCQWC9DLXQMGWJVSFSNDPMGDJBBYORTCZTKOVJUYKZVDIWEBOWPTLTJIGWXZCIXPJRVQTXFFRHBC9TUNKTHLI9KFWIUFMBMXBXAOQFUEZOGOJOUBVMWJSAKDGGEFBFMEBXINMZAPTULYTIGIGFWDRHROOBQUR9BUTS9URVCUWYSOJVVMLRFORGJABJZZH9TGANVGQGUYQZDXJUC9JPWRBWBBASLNA9KRAZMWIQYH9OWVAALPRWKDTJKAWBTTZAAVGUF9LKGGQQKHFJKKDFRKWTSBWJTYRIRFFDMDVXWXRXDXSGE9PAAMGGPPSKOPRBYFWPHIWGWGFGXNLVEFBHZFCEFXCKTVKKXGIIRTXSFQ9QBOQHCYHR9ZOKK9NQSDGVNJY9YJPDTKJWVBVOIYUJFJXZLNBIIKJEJVSMITYEGOHSCEBIGLBSDPIEJDRQTWLYBBZX9PJTWVDUW9NOXHWDWIQPKLIJLDIJTDUIXRSXFCEFMCJ9JKWMNURRCONSXWJVDBUPZBSKDMTTTTYUBVLFMJJYZBQWZJQDQKIDQOK9QALKYTKUVOSXPKYPNAHXPLGTCIDDLGVIEORXJEEKJGYWDHQGSEZYMTEAICIIURWXQCNESEFGDCZXMWWEWQSCEGFKABHHFKJYYLZYKBPMYCVDT9D9BAHHKOASETPQ9ZXSFSWUBZDTSJP9ZGJILDYCYQHOFYJDHVLD9ZSYESKWAYOKGTQKMSSY9ZVQT9VUHYISVDWVIFMFSQKFNEOKLKEVPUDMKCSLXVQVMPCFHGSUYQTPTGYBBVLIHBJGBTIWCCFULPQJIJTJEP9UKTABSRTYN9JLMWOVJNAMMCEDSGMHZUEOYEQGKRG9QYVVFFBDMPSMOZVZGSSELBYPTFAPZBNXTZOYBKWBQHUSSDCXAMCLKRCZKCS9DQMDDRDDHJSTMEGQXYHEVMJFNXQEMDTDQYCPPN9QQRSWJXZF9LJQREO9CDQZDLVWDCFASBOOWPNCKWM9VXDOQKDUPOJAEUNJGNCUWH9MQ9DIOLJVZJCIARC9OMVXAFAP9DFWRJVJMXNJFDPVNFPXIWQHEYXUFUIRVV9BOGTMOOZNLCQHEYNWBXPTLYYRQAEUR9WSARSRJI9UGQFVIUKAIESYRHMDNXDSDEKVINMJPKGPUTGSQACBGUUZMKXBMDYXI9QIIXWGKELEFGBXOVOWYICDLGWXADMOVWMJNPDIZMFAXIQKGUTKKKJDJQOVTFRLLTPDMNQPC9LM9DKUYTBQDXOBRH",
        "CD9HDHQHHFFHODFDTEM9VHTCGDMCKHNBLIWABAADNBXCKIQDI9VBNGRGDAGBLIIIOFTGSA9HXELIKIJ9RHEGYGFFWDR9PHLFFAHGGBHGPHSGKBIDVGSHMAJ9KIG9LFZFWB9EZHUDYAMAIGSEA9LAKFHHN9FCAEGIRCCFWEGELHKHICCENFRGAFCICAPFKIACQGUG9BSFYHQDECCDPHQCGEW9EHNDQGKACGII9IACMCJGUCDFB99ICGEDKFNFFAWEZHYAEGFHBEZ9KCBGDDHEJICHIGKFNFSAXCEGF9DCHBSHLFSAOHJEJHBCBFPGH9TDYHNHLHQCWDLGHAPDRAUHD9LFZHLCGDNFLFACTHLENHHEEBHEEDQAHIRGWAQDO9QG9HHCHFUG9FMDCBFGEA9A9HS9ZHQA99NDEEO9SDRDLEZGECVENBSCKISDDFCDQBMEZBFC9HQDGFFIYCNFBCZBJEI9QDFFXHTETFPCJGWBID9FBGZCNGX9XGBBSESEFINFNFUDGCOHD9HEV9JELGNAEAICRBYDDFOEDEL9KH9IGBCFKGWDQHZAVFQALEPAV9NFI9KFAHKEAGGIGIIIZ9EIBCL9FCGEABZEHGLBNAKDH9JAVEI9EBMHWBMBTETCVFWCXFU9VAVDNANHTFIEDBTFMAV9FHQ9HAQENABCYD9FLCJ9TCBIJCK9B9BDKGHIEECIUBDBFGKIZAUBOAADV9O9WDRFHDFIXECFA9ACDBTFPFXAQBXHLC9BODL9WALHBBHIRCNHRGTBNCZAA99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"
      ]
    },
    duration: 0
  };

  const mockDownloadResponse = { ixi: { signatures: [null] }, duration: 0 };

  mock
    .onPost("https://poll.oysternodes.com:14265", {
      command: "Oyster.findGeneratedSignatures",
      version: 1,
      hash: "d762241f67eb4efdd846606dd88370999205ffed0c8b7a642490c97ae59d3180",
      count: 1,
      binary: false
    })
    .reply(200, mockPollResponse1, mockIotaHeader);

  mock
    .onPost("https://poll.oysternodes.com:14265", {
      command: "Oyster.findGeneratedSignatures",
      version: 1,
      hash: "08969a0c5920e0bbc5250c8cc160bc8e71236cdfa79f91f23d41b5859c689f06",
      count: 2,
      binary: false
    })
    .reply(200, mockPollResponse2, mockIotaHeader);

  mock
    .onPost("https://download.oysternodes.com:14265", {
      command: "Oyster.findGeneratedSignatures",
      version: 1,
      hash: "d762241f67eb4efdd846606dd88370999205ffed0c8b7a642490c97ae59d3180",
      count: 1,
      binary: false
    })
    .reply(200, mockDownloadResponse, mockIotaHeader);

  const d = Download.toBlob(TEST_HANDLE, {
    autoStart: true,
    iotaProviders: [
      { provider: "https://poll.oysternodes.com:14265" },
      { provider: "https://download.oysternodes.com:14265" }
    ]
  });

  expect.assertions(2);

  d.on("metadata", metadata => {
    expect(metadata).toEqual({
      ext: "rtf",
      fileName: "test-file.rtf",
      numberOfChunks: 1
    });
  });

  d.on(EVENTS.DOWNLOAD_PROGRESS, ({ progress }) => {
    expect(progress).toEqual(100);
  });

  d.on(EVENTS.FINISH, () => done());
});

test("Download.toBuffer emits the expected events", done => {
  const mock = new MockAdapter(axios);
  const mockIotaHeader = {
    "content-type": "application/json"
  };

  const mockPollResponse1 = {
    ixi: {
      signatures: [
        "999999A9XHOCBG9GLICCGAJBKDGCGBS9EIFENCWCFE9AKDKEQAEIJ9BIKBKFMHVDGHGCIGHCVHGBMFECCCZCXGNAFFTCLDRFVD9BQFTFNAUGH9HFYDXHACQBFHX9DGJER9RF9DOHNEU9LEEBOEV9EEXEKHSCWEJFYHAAWDHHSHWGI9MDR9KGZCOG9IFIK9A9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"
      ]
    },
    duration: 0
  };

  const mockPollResponse2 = {
    ixi: {
      signatures: [
        "S9RHHBBCSCNGRCNB9AY9BCHEMCV9ZHJITHZEOBNGTDEIC9BE9HJAWFEFICNFADCGWDCFSAEGGEKCPDZEHEOAKDVAJCVACBYDXGZBDADCWBACQHKAHASDEVJJSGOANJCGEYEQPJWVLNOHCFJDDDOKNUUGLQYESNLHGEOZATEOCWUGVLMZSXZUPJBDZDTJFBGCRJNJI9LIZXJSAJVUCLVEXBSIHSVTX9D9KIIYTSSTCKDZBY9QKD9XRWZUASITAXJMUPPQOVO9WZNYNBPMZPNSJOMEPYFUEXATGAULDAVYKE9CQAQNZOBQFUUFWKMU9DOYUQQJOYOCLECHMETFHAVUTVHPWXIHYX99TAFPVEMXDZNRPXEZKGOXNXGJPKSCFFGIKLVSFWONMUHMJEJVFSRCYMACAMUVLNJPDQRGWNKFE9XNPGKYUBPARFBBPFYOFHT9DLRQPDADWIVJXEBETBQTQAMOXIQWJSVUTBXLIHBF9VHHJABPY9KTHHGBF9OMATPGZSLLBSVRQKFBBPYQRIBXDKBZN9YDPCZDXGDNKJBETTBOECQPHERZZSGDALABJLCPW9ZWEYS9ZYTKQHNTZQCIJMCWJXSVMXUPQRTPNXBVEBYFXAHBRWEUTJOUNDM9TKVCCEMWHJ9PXSWIMYHJMLSBXCKDRUCXEHHLWUQQUTSDVVKVKZBIZTOESQOWRVJZVDLXFKSZQONXPLCVZRSLUXLWMPNILK9YIPBHDNIGDCLZSBQJRJWPNXNKWTENXZQQWKIIVBOLCCXKOQWZZNIYUYNQVDXJLJJLTJHEAEILNETRWYTZOKYSFTMAPSTKNDM9OYCRZRTLSGB9DE9DQJROTMYFIETIHIGJI9VXJOGSTZN9LNWWMRKIET9DUPSRIAWCDOVPTBXILPY9ZDGSBKZJHVLSRSFWQZMXCQWC9DLXQMGWJVSFSNDPMGDJBBYORTCZTKOVJUYKZVDIWEBOWPTLTJIGWXZCIXPJRVQTXFFRHBC9TUNKTHLI9KFWIUFMBMXBXAOQFUEZOGOJOUBVMWJSAKDGGEFBFMEBXINMZAPTULYTIGIGFWDRHROOBQUR9BUTS9URVCUWYSOJVVMLRFORGJABJZZH9TGANVGQGUYQZDXJUC9JPWRBWBBASLNA9KRAZMWIQYH9OWVAALPRWKDTJKAWBTTZAAVGUF9LKGGQQKHFJKKDFRKWTSBWJTYRIRFFDMDVXWXRXDXSGE9PAAMGGPPSKOPRBYFWPHIWGWGFGXNLVEFBHZFCEFXCKTVKKXGIIRTXSFQ9QBOQHCYHR9ZOKK9NQSDGVNJY9YJPDTKJWVBVOIYUJFJXZLNBIIKJEJVSMITYEGOHSCEBIGLBSDPIEJDRQTWLYBBZX9PJTWVDUW9NOXHWDWIQPKLIJLDIJTDUIXRSXFCEFMCJ9JKWMNURRCONSXWJVDBUPZBSKDMTTTTYUBVLFMJJYZBQWZJQDQKIDQOK9QALKYTKUVOSXPKYPNAHXPLGTCIDDLGVIEORXJEEKJGYWDHQGSEZYMTEAICIIURWXQCNESEFGDCZXMWWEWQSCEGFKABHHFKJYYLZYKBPMYCVDT9D9BAHHKOASETPQ9ZXSFSWUBZDTSJP9ZGJILDYCYQHOFYJDHVLD9ZSYESKWAYOKGTQKMSSY9ZVQT9VUHYISVDWVIFMFSQKFNEOKLKEVPUDMKCSLXVQVMPCFHGSUYQTPTGYBBVLIHBJGBTIWCCFULPQJIJTJEP9UKTABSRTYN9JLMWOVJNAMMCEDSGMHZUEOYEQGKRG9QYVVFFBDMPSMOZVZGSSELBYPTFAPZBNXTZOYBKWBQHUSSDCXAMCLKRCZKCS9DQMDDRDDHJSTMEGQXYHEVMJFNXQEMDTDQYCPPN9QQRSWJXZF9LJQREO9CDQZDLVWDCFASBOOWPNCKWM9VXDOQKDUPOJAEUNJGNCUWH9MQ9DIOLJVZJCIARC9OMVXAFAP9DFWRJVJMXNJFDPVNFPXIWQHEYXUFUIRVV9BOGTMOOZNLCQHEYNWBXPTLYYRQAEUR9WSARSRJI9UGQFVIUKAIESYRHMDNXDSDEKVINMJPKGPUTGSQACBGUUZMKXBMDYXI9QIIXWGKELEFGBXOVOWYICDLGWXADMOVWMJNPDIZMFAXIQKGUTKKKJDJQOVTFRLLTPDMNQPC9LM9DKUYTBQDXOBRH",
        "CD9HDHQHHFFHODFDTEM9VHTCGDMCKHNBLIWABAADNBXCKIQDI9VBNGRGDAGBLIIIOFTGSA9HXELIKIJ9RHEGYGFFWDR9PHLFFAHGGBHGPHSGKBIDVGSHMAJ9KIG9LFZFWB9EZHUDYAMAIGSEA9LAKFHHN9FCAEGIRCCFWEGELHKHICCENFRGAFCICAPFKIACQGUG9BSFYHQDECCDPHQCGEW9EHNDQGKACGII9IACMCJGUCDFB99ICGEDKFNFFAWEZHYAEGFHBEZ9KCBGDDHEJICHIGKFNFSAXCEGF9DCHBSHLFSAOHJEJHBCBFPGH9TDYHNHLHQCWDLGHAPDRAUHD9LFZHLCGDNFLFACTHLENHHEEBHEEDQAHIRGWAQDO9QG9HHCHFUG9FMDCBFGEA9A9HS9ZHQA99NDEEO9SDRDLEZGECVENBSCKISDDFCDQBMEZBFC9HQDGFFIYCNFBCZBJEI9QDFFXHTETFPCJGWBID9FBGZCNGX9XGBBSESEFINFNFUDGCOHD9HEV9JELGNAEAICRBYDDFOEDEL9KH9IGBCFKGWDQHZAVFQALEPAV9NFI9KFAHKEAGGIGIIIZ9EIBCL9FCGEABZEHGLBNAKDH9JAVEI9EBMHWBMBTETCVFWCXFU9VAVDNANHTFIEDBTFMAV9FHQ9HAQENABCYD9FLCJ9TCBIJCK9B9BDKGHIEECIUBDBFGKIZAUBOAADV9O9WDRFHDFIXECFA9ACDBTFPFXAQBXHLC9BODL9WALHBBHIRCNHRGTBNCZAA99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"
      ]
    },
    duration: 0
  };

  const mockDownloadResponse = { ixi: { signatures: [null] }, duration: 0 };

  mock
    .onPost("https://poll.oysternodes.com:14265", {
      command: "Oyster.findGeneratedSignatures",
      version: 1,
      hash: "d762241f67eb4efdd846606dd88370999205ffed0c8b7a642490c97ae59d3180",
      count: 1,
      binary: false
    })
    .reply(200, mockPollResponse1, mockIotaHeader);

  mock
    .onPost("https://poll.oysternodes.com:14265", {
      command: "Oyster.findGeneratedSignatures",
      version: 1,
      hash: "08969a0c5920e0bbc5250c8cc160bc8e71236cdfa79f91f23d41b5859c689f06",
      count: 2,
      binary: false
    })
    .reply(200, mockPollResponse2, mockIotaHeader);

  mock
    .onPost("https://download.oysternodes.com:14265", {
      command: "Oyster.findGeneratedSignatures",
      version: 1,
      hash: "d762241f67eb4efdd846606dd88370999205ffed0c8b7a642490c97ae59d3180",
      count: 1,
      binary: false
    })
    .reply(200, mockDownloadResponse, mockIotaHeader);

  const d = Download.toBuffer(TEST_HANDLE, {
    autoStart: true,
    iotaProviders: [
      { provider: "https://poll.oysternodes.com:14265" },
      { provider: "https://download.oysternodes.com:14265" }
    ]
  });

  expect.assertions(2);

  d.on("metadata", metadata => {
    expect(metadata).toEqual({
      ext: "rtf",
      fileName: "test-file.rtf",
      numberOfChunks: 1
    });
  });

  d.on(EVENTS.DOWNLOAD_PROGRESS, ({ progress }) => {
    expect(progress).toEqual(100);
  });

  d.on(EVENTS.FINISH, () => done());
});
