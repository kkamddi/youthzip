import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "policies.json");
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const policies = payload.policies || [];
const indexablePolicies = policies.filter((item) => item.status !== "마감");
const contentDate = payload.updatedAt || new Date().toISOString().slice(0, 10);
const policyTitleCounts = policies.reduce((counts, item) => {
  const title = String(item.title || "청년지원사업");
  counts.set(title, (counts.get(title) || 0) + 1);
  return counts;
}, new Map());
const collator = new Intl.Collator("ko-KR");
const siteUrl = "https://youthzip.pages.dev";
const siteName = "청년혜택.zip";
const blogUrl = "https://youthpick.tistory.com";
const defaultOgImage = `${siteUrl}/assets/og-image.svg`;

const regions = [
  ["all", "전체"],
  ["national", "전국"],
  ["seoul", "서울"],
  ["busan", "부산"],
  ["daegu", "대구"],
  ["incheon", "인천"],
  ["gwangju", "광주"],
  ["daejeon", "대전"],
  ["ulsan", "울산"],
  ["sejong", "세종"],
  ["gyeonggi", "경기"],
  ["gangwon", "강원"],
  ["chungbuk", "충북"],
  ["chungnam", "충남"],
  ["jeonbuk", "전북"],
  ["jeonnam", "전남"],
  ["gyeongbuk", "경북"],
  ["gyeongnam", "경남"],
  ["jeju", "제주"]
];
const types = [
  ["all", "전체"],
  ["housing", "주거"],
  ["job", "취업"],
  ["finance", "금융"],
  ["education", "교육"],
  ["transport", "교통"],
  ["culture", "문화"],
  ["welfare", "복지"],
  ["startup", "창업"]
];

const statuses = [
  ["all", "전체"],
  ["open", "신청중"],
  ["closing-soon", "마감임박"],
  ["scheduled", "예정"],
  ["closed", "마감"]
];

const generatedDirs = ["policy", "region", "type", "status", "guides", "calendar", "data/app"];

const staticPages = [
  {
    slug: "about",
    title: "소개",
    description: "청년혜택.zip은 청년지원사업을 조건별로 빠르게 찾을 수 있도록 정리한 안내 사이트입니다.",
    body: [
      "청년혜택.zip은 지역, 지원 유형, 신청 상태를 기준으로 청년지원사업을 한눈에 살펴볼 수 있도록 만든 정보 안내 사이트입니다.",
      "온통청년 정책 데이터와 각 운영기관의 공식 공고를 바탕으로 자동 수집한 뒤, 검색과 비교에 필요한 항목을 청년혜택.zip 편집팀이 정리합니다. 데이터는 매일 두 차례 갱신하는 것을 원칙으로 합니다.",
      "각 정책의 신청 여부와 세부 자격은 운영기관의 공식 공고가 최종 기준입니다."
    ]
  },
  {
    slug: "editorial-policy",
    title: "편집 방침",
    description: "청년혜택.zip의 정책 정보 정리 기준과 편집 원칙입니다.",
    body: [
      "정책명, 지역, 분야, 신청기간, 지원내용, 대상 조건은 공식 정책 데이터와 공고 내용을 기준으로 정리합니다.",
      "자동 수집 과정에서 지역·유형·신청 상태를 표준화하고, 마감일이 지난 정책은 검색 결과에서 제외합니다. 주요 가이드는 편집팀이 검색 의도에 맞춰 직접 구성하고 자료 기준일을 표시합니다.",
      "정보 전달을 위해 긴 문장은 요약할 수 있으며, 신청 전에는 반드시 공식 링크에서 최신 공고와 제출 서류를 확인해야 합니다. 오류 제보는 청년혜택.zip 블로그의 방명록이나 댓글로 접수합니다."
    ]
  },
  {
    slug: "sources",
    title: "자료·이미지 출처",
    description: "청년혜택.zip에서 사용하는 이미지와 자료 출처 안내입니다.",
    body: [
      "정책 정보는 온통청년 정책 데이터, 마이홈·LH 등 공공주택 공급기관 공고, HUG 안심전세포털과 각 운영기관의 공식 공고를 출처로 사용하며, 모든 정책 상세 페이지에서 해당 공식 링크를 제공합니다.",
      "현재 정책 목록과 상세 페이지는 별도 정책 이미지를 사용하지 않고 텍스트 정보 중심으로 구성합니다.",
      "향후 이미지가 추가되는 경우 공공누리, 공식 보도자료, 직접 제작 이미지 등 사용 가능한 자료를 기준으로 출처를 함께 표기합니다."
    ]
  },
  {
    slug: "notice",
    title: "면책·공지",
    description: "청년혜택.zip 이용 전 확인해야 할 공지와 면책 안내입니다.",
    body: [
      "본 사이트의 정보는 청년지원사업 탐색을 돕기 위한 참고 자료입니다. 모집 일정, 예산 소진, 자격 조건, 제출 서류는 운영기관 사정에 따라 변경될 수 있습니다.",
      "신청 및 계약 등 중요한 결정 전에는 각 정책의 공식 링크와 담당 기관 안내를 최종 확인해 주세요."
    ]
  },
  {
    slug: "privacy",
    title: "개인정보처리방침",
    description: "청년혜택.zip의 개인정보 처리 안내입니다.",
    body: [
      "청년혜택.zip은 현재 회원가입, 댓글, 직접 신청 기능을 제공하지 않으며 이용자의 주민등록번호, 연락처, 계좌번호 등 민감한 개인정보를 직접 수집하지 않습니다.",
      "청년혜택.zip Android 앱의 찜 목록과 검색 조건은 이용자의 기기에만 저장됩니다. 마감 알림을 켜면 선택한 정책의 종료일을 기준으로 기기 내 로컬 알림이 예약되며, 이 정보는 청년혜택.zip 서버로 전송되지 않습니다.",
      "서비스 품질과 이용 현황 확인을 위해 Cloudflare Web Analytics와 같은 비식별 통계 도구를 사용할 수 있습니다. 향후 광고 서비스가 도입되면 쿠키 사용과 광고 사업자 관련 내용을 이 방침에 고지합니다.",
      "외부 공식 신청 사이트로 이동한 뒤 입력하는 개인정보는 해당 기관의 개인정보처리방침을 따릅니다."
    ]
  },
  {
    slug: "contact",
    title: "연락처",
    description: "청년혜택.zip 문의와 제보 안내입니다.",
    body: [
      "정책 정보 오류, 링크 오류, 제휴 문의는 청년혜택.zip 블로그(youthpick.tistory.com)의 방명록 또는 관련 글 댓글로 남겨 주세요.",
      "정확한 신청 상담은 각 정책 상세 페이지의 공식 링크 또는 담당 기관 연락처를 이용해 주세요."
    ]
  }
];

const guides = [
  {
    slug: "2026-youth-monthly-rent-support",
    title: "2026년 청년 월세 지원 신청 가이드",
    description: "2026년 청년 월세 지원, 주거비 지원, 임대료 지원 정책을 신청 대상, 소득 조건, 신청기간, 공식 링크 기준으로 확인하세요.",
    intro: "2026년에 청년 월세 지원을 찾는다면 먼저 본인의 거주지, 나이, 소득, 임대차 계약 조건을 함께 봐야 합니다. 같은 월세 지원이라도 전국 공통 사업과 지자체 사업의 신청 기간과 제출 서류가 다르므로, 현재 신청 가능한 정책부터 확인하는 것이 좋습니다.",
    sections: [
      ["검색할 때 같이 볼 키워드", "청년 월세 지원, 2026 청년 월세, 청년 주거비 지원, 임대료 지원, 무주택 청년 지원을 함께 확인하면 누락을 줄일 수 있습니다. 지역명이 붙은 서울 청년 월세 지원, 경기도 청년 월세 지원처럼 검색하면 더 구체적인 결과를 찾기 쉽습니다."],
      ["신청 전 체크할 것", "주민등록상 거주지, 실제 임대차 계약 주소, 본인 명의 계약 여부, 월세 납부 증빙, 소득 기준, 기존 주거 지원 수혜 여부를 먼저 확인해야 합니다. 마감임박 정책은 예산 소진 전에 공식 링크에서 접수 가능 여부를 확인하세요."]
    ],
    related: (item) => item.type === "주거" || /월세|주거비|임대료|임차료|무주택|주거 지원/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["2026년 청년 월세 지원은 어디서 신청하나요?", "사업마다 운영기관이 다릅니다. 청년혜택.zip에서는 관련 정책을 모아 보여주고, 실제 신청은 각 상세 페이지의 공식 링크에서 진행해야 합니다."],
      ["전국 청년 월세 지원과 지역 월세 지원을 같이 볼 수 있나요?", "가능합니다. 전국 사업과 서울, 경기 등 지역 사업을 함께 확인하되 중복 수혜 제한은 반드시 공식 공고에서 확인해야 합니다."]
    ]
  },
  {
    slug: "2026-youth-jeonse-support",
    title: "2026년 청년 전세 지원·보증금 지원 정리",
    description: "2026년 청년 전세 지원, 보증금 지원, 전세자금대출 이자 지원, 주거 금융 지원 정책을 공식 링크 기준으로 확인하세요.",
    intro: "청년 전세 지원은 월세 지원보다 조건이 더 복잡한 경우가 많습니다. 보증금, 임차 주택 유형, 소득, 대출 여부, 이자 지원 방식이 정책마다 다르기 때문에 본인의 계약 상황과 맞는 정책을 좁혀 보는 것이 중요합니다.",
    sections: [
      ["주요 지원 유형", "전세자금대출 이자 지원, 보증금 일부 지원, 임차보증금 융자, 청년 주거 금융 지원처럼 유형이 나뉩니다. 현금 지원인지, 이자 지원인지, 대출 연계인지 먼저 구분해야 합니다."],
      ["검색할 때 같이 볼 키워드", "청년 전세 지원, 청년 보증금 지원, 청년 전세자금대출, 청년 임차보증금, 전세 이자 지원, 주거 금융 지원을 함께 확인하면 좋습니다."]
    ],
    related: (item) => item.type === "주거" || /전세|보증금|임차보증금|전세자금|이자 지원|융자|대출/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년 전세 지원은 월세 지원과 같이 받을 수 있나요?", "중복 수혜 가능 여부는 사업마다 다릅니다. 이미 주거 지원을 받고 있다면 공식 공고의 중복 제한을 먼저 확인해야 합니다."],
      ["전세 계약 전에도 신청할 수 있나요?", "일부 사업은 계약 전 상담이나 대출 심사가 가능하지만, 대부분은 계약 조건과 주택 기준을 확인합니다. 공식 링크에서 신청 순서를 확인하세요."]
    ]
  },
  {
    slug: "2026-youth-savings-account",
    title: "2026년 청년 적금·저축 지원 정책 모아보기",
    description: "2026년 청년 적금, 청년도약계좌, 청년내일저축계좌, 자산형성 지원 정책을 소득 조건과 신청기간 기준으로 확인하세요.",
    intro: "청년 적금과 저축 지원은 목돈 마련을 돕는 정책이지만, 소득 기준과 근로 여부, 납입 기간, 중도해지 조건이 중요합니다. 단순히 지원금 규모만 보지 말고 내가 유지할 수 있는 조건인지 함께 확인해야 합니다.",
    sections: [
      ["대표 검색 키워드", "청년 적금, 2026 청년 적금, 청년도약계좌, 청년내일저축계좌, 자산형성 지원, 청년 금융 지원을 함께 보면 저축형 정책을 더 잘 찾을 수 있습니다."],
      ["신청 전 체크할 것", "나이, 개인소득, 가구소득, 근로 여부, 기존 유사 사업 참여 여부, 납입 기간, 중도해지 시 불이익을 확인해야 합니다. 지역형 자산형성 사업은 거주지 조건도 중요합니다."]
    ],
    related: (item) => item.type === "금융" || /적금|저축|도약계좌|내일저축|자산형성|목돈|통장|금융/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년도약계좌와 청년내일저축계좌는 같은 건가요?", "다른 제도입니다. 대상 소득, 납입 방식, 지원 구조가 다르므로 공식 공고와 운영기관 안내를 따로 확인해야 합니다."],
      ["청년 적금 지원은 소득이 있어야 신청할 수 있나요?", "근로 또는 사업소득을 요구하는 정책이 많지만 모든 사업이 같은 기준은 아닙니다. 각 정책의 소득 기준과 근로 조건을 확인하세요."]
    ]
  },
  {
    slug: "2026-youth-transport-support",
    title: "2026년 청년 대중교통비 지원 정리",
    description: "2026년 청년 대중교통비 지원, 교통비 환급, 면접 교통비, 통학·출퇴근 교통 지원 정책을 공식 링크 기준으로 확인하세요.",
    intro: "대중교통비 지원은 통학, 출퇴근, 면접 준비가 반복되는 청년에게 체감이 큰 정책입니다. 교통카드 사용 실적, 나이, 거주지, 신청 기간에 따라 지원 가능 여부가 달라집니다.",
    sections: [
      ["함께 검색할 키워드", "청년 대중교통비 지원, 청년 교통비 환급, K-패스 청년, 면접 교통비, 통학 교통비, 출퇴근 교통비 지원을 함께 확인하면 좋습니다."],
      ["확인할 조건", "이용 교통수단, 월 이용 횟수, 교통카드 등록 여부, 거주지, 나이 기준, 환급 방식, 신청 기간을 확인해야 합니다. 지역 확장형 교통 정책은 거주지 기준이 특히 중요합니다."]
    ],
    related: (item) => item.type === "교통" || /교통비|대중교통|K-패스|K패스|경기패스|I-패스|아이패스|면접 교통|통학|출퇴근/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년 대중교통비 지원은 자동으로 환급되나요?", "정책마다 다릅니다. 카드 등록이나 별도 신청이 필요한 경우가 있으므로 공식 링크에서 신청 절차를 확인해야 합니다."],
      ["지역 교통비 지원과 K-패스를 같이 볼 수 있나요?", "네. K-패스와 지역 확장형 혜택은 조건이 다를 수 있으므로 거주지 기준과 환급률을 함께 확인하는 것이 좋습니다."]
    ]
  },
  {
    slug: "k-pass-youth-benefit",
    title: "K-패스 청년 혜택과 지역 교통비 지원 비교",
    description: "K-패스 청년 환급, The 경기패스, 인천 I-패스 등 대중교통비 지원 혜택을 청년 기준과 공식 링크 중심으로 확인하세요.",
    intro: "K-패스는 대중교통을 자주 이용하는 청년에게 중요한 교통비 환급 제도입니다. 여기에 The 경기패스, 인천 I-패스처럼 지역별 확장 혜택이 붙으면 청년 연령 기준이나 환급 조건이 달라질 수 있습니다.",
    sections: [
      ["비교해서 볼 항목", "청년 연령 기준, 월 최소 이용 횟수, 환급률, 적용 교통수단, 거주지 조건, 카드 등록 여부를 비교해야 합니다. 같은 K-패스 기반이어도 지역 확장 혜택은 세부 조건이 다릅니다."],
      ["이 페이지가 필요한 이유", "검색할 때 K-패스, K패스 청년, 경기패스, 인천 I-패스, 교통비 환급처럼 표현이 섞여 나옵니다. 관련 정책을 한곳에서 보고 공식 링크로 이동하면 확인 시간이 줄어듭니다."]
    ],
    related: (item) => /K-패스|K패스|경기패스|The 경기패스|I-패스|아이패스|대중교통비|교통비 환급/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["K-패스는 청년만 신청할 수 있나요?", "아닙니다. 다만 청년층은 별도 환급 기준이 적용될 수 있어 본인의 나이와 이용 조건을 확인해야 합니다."],
      ["경기패스나 인천 I-패스는 K-패스와 다른 건가요?", "K-패스를 기반으로 지역별 혜택을 확장한 성격입니다. 거주지와 청년 기준이 다를 수 있으므로 공식 안내를 확인하세요."]
    ]
  },
  {
    slug: "youth-monthly-rent-support",
    title: "청년 월세 지원·주거 지원 총정리",
    description: "청년 월세 지원, 주거비 지원, 전세·정착 지원 등 청년 주거 지원사업을 신청 대상, 기간, 공식 링크 기준으로 모아보세요.",
    intro: "월세와 주거비 부담을 줄이고 싶은 청년이라면 먼저 거주 지역, 소득 조건, 신청 기간을 함께 확인해야 합니다. 이 페이지에서는 청년 월세 지원과 주거 관련 청년 정책을 빠르게 훑어볼 수 있도록 정리했습니다.",
    sections: [
      ["먼저 확인할 조건", "대부분의 청년 주거 지원은 나이, 거주지, 소득, 무주택 여부, 임대차 계약 여부를 함께 봅니다. 같은 월세 지원이라도 지역별 예산과 접수 방식이 다르기 때문에 공식 공고의 신청 기간을 반드시 확인해야 합니다."],
      ["찾는 방법", "유형은 주거로 보고, 상태는 신청중 또는 마감임박을 먼저 확인하세요. 지역이 정해져 있다면 거주 지역 필터를 함께 적용하면 실제 신청 가능한 정책을 더 빨리 좁힐 수 있습니다."]
    ],
    related: (item) => item.type === "주거" || /월세|주거|전세|임대|정착/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년 월세 지원은 중복 신청할 수 있나요?", "사업마다 중복 수혜 제한이 다릅니다. 기존 주거급여, 지자체 월세 지원, 유사 주거 지원을 받고 있다면 공식 공고에서 중복 제한을 먼저 확인해야 합니다."],
      ["거주 지역과 주민등록 지역이 다르면 신청할 수 있나요?", "정책마다 기준이 다릅니다. 일부 사업은 주민등록상 주소를 기준으로 보고, 일부는 실제 거주지나 임대차 계약 주소를 함께 확인합니다."]
    ]
  },
  {
    slug: "youth-job-support",
    title: "청년 취업 지원 정책 모아보기",
    description: "청년 취업 지원, 면접 지원, 일경험, 직무교육, 구직활동 지원사업을 신청 상태와 공식 링크 기준으로 확인하세요.",
    intro: "취업 준비 중인 청년에게는 구직활동비, 면접비, 일경험, 직무교육처럼 목적이 다른 지원사업이 나뉘어 제공됩니다. 본인 상황에 맞는 정책을 고르려면 지원 내용보다 신청 대상과 진행 상태를 먼저 확인하는 것이 좋습니다.",
    sections: [
      ["먼저 확인할 조건", "미취업 여부, 졸업 여부, 재학생 가능 여부, 거주지, 소득 기준이 자주 쓰입니다. 일경험이나 직무교육은 모집 인원과 선착순 여부도 중요합니다."],
      ["찾는 방법", "유형은 취업으로 보고, 검색창에 면접, 일경험, 구직, 교육 같은 단어를 함께 입력하면 목적에 맞는 사업을 더 빠르게 찾을 수 있습니다."]
    ],
    related: (item) => item.type === "취업" || /취업|구직|면접|일경험|직무|채용|인턴/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["재학생도 청년 취업 지원을 받을 수 있나요?", "사업마다 다릅니다. 졸업예정자나 휴학생까지 허용하는 사업이 있고, 미취업 졸업자만 가능한 사업도 있습니다."],
      ["마감임박 정책은 먼저 신청해야 하나요?", "마감일이 가까운 정책은 접수 종료나 예산 소진 가능성이 있으므로 공식 링크에서 접수 가능 여부를 먼저 확인하는 편이 좋습니다."]
    ]
  },
  {
    slug: "seoul-youth-subsidy",
    title: "서울 청년 지원금·청년 정책 모아보기",
    description: "서울 청년 지원금, 서울 청년 월세 지원, 취업·주거·복지 정책을 지역별로 모아 공식 신청 링크와 함께 확인하세요.",
    intro: "서울 청년 지원사업은 주거, 취업, 복지, 문화 영역으로 나뉘어 운영되는 경우가 많습니다. 같은 서울 정책이라도 자치구별 사업과 서울시 전체 사업이 섞여 있으니 지역 조건을 함께 확인하는 것이 중요합니다.",
    sections: [
      ["서울 정책을 볼 때 중요한 점", "서울시 전체 대상인지, 특정 자치구 거주 청년 대상인지 확인해야 합니다. 신청 기간이 짧거나 모집 인원이 정해진 사업은 마감임박 상태를 먼저 보는 것이 좋습니다."],
      ["추천 확인 순서", "먼저 신청중 정책을 보고, 그다음 마감임박 정책을 확인하세요. 월세, 면접, 마음건강, 교통비처럼 목적 키워드를 검색창에 입력하면 더 정확하게 좁힐 수 있습니다."]
    ],
    related: (item) => item.regionGroup === "서울" || item.city === "서울" || String(item.region || "").includes("서울"),
    faq: [
      ["서울 청년 지원금은 서울 거주자만 신청할 수 있나요?", "대부분은 서울 거주 또는 서울 생활권 조건을 두지만 사업마다 다릅니다. 주민등록 주소, 학교·직장 소재지 기준을 각각 확인해야 합니다."],
      ["서울 자치구 사업도 함께 볼 수 있나요?", "정책 데이터에 포함된 경우 서울 지역 목록에서 함께 확인할 수 있습니다. 상세 페이지의 공식 링크에서 자치구 공고를 다시 확인하세요."]
    ]
  },
  {
    slug: "gyeonggi-youth-subsidy",
    title: "경기도 청년 지원금·청년 정책 모아보기",
    description: "경기도 청년 지원금, 청년 취업 지원, 주거·복지 정책을 지역별로 모아 신청 기간과 공식 링크 기준으로 확인하세요.",
    intro: "경기도 청년 정책은 도 단위 사업과 시·군 단위 사업이 함께 운영됩니다. 거주 중인 시·군 조건이 붙는 경우가 많으므로 제목과 상세 조건에서 지역 범위를 꼭 확인해야 합니다.",
    sections: [
      ["경기도 정책을 볼 때 중요한 점", "경기도 전체 대상인지, 특정 시·군 청년 대상인지 먼저 확인하세요. 예산 소진형 지원금은 접수 기간 안이라도 조기 종료될 수 있습니다."],
      ["추천 확인 순서", "경기도 지역 페이지에서 신청중과 마감임박 사업을 먼저 보고, 주거·취업·복지처럼 필요한 유형을 추가로 좁히는 방식이 효율적입니다."]
    ],
    related: (item) => item.regionGroup === "경기" || item.city === "경기" || String(item.region || "").includes("경기"),
    faq: [
      ["경기도 청년 지원금은 시·군이 달라도 신청할 수 있나요?", "사업마다 다릅니다. 경기도 전체 대상 사업도 있고, 특정 시·군 거주자만 가능한 사업도 있으니 공식 공고의 지역 조건을 확인해야 합니다."],
      ["경기도 청년 정책은 어디서 신청하나요?", "사업별 운영기관이 다르므로 청년혜택.zip 상세 페이지의 공식 링크에서 신청 페이지와 제출 서류를 최종 확인해야 합니다."]
    ]
  },
  {
    slug: "youth-rent-checklist",
    title: "청년 월세 지원 신청 전 체크리스트",
    description: "청년 월세 지원 신청 전에 확인해야 할 거주지, 소득, 임대차 계약, 중복 수혜, 제출 서류 기준을 정리했습니다.",
    intro: "청년 월세 지원은 신청 기간만 보고 접근하면 놓치는 조건이 많습니다. 거주지와 임대차 계약, 소득 기준, 기존 지원 수혜 여부를 먼저 확인하면 실제 신청 가능성을 빠르게 판단할 수 있습니다.",
    sections: [
      ["신청 전 확인할 것", "주민등록상 주소, 실제 거주지, 임대차 계약 명의, 월세 납부 증빙, 소득 기준, 무주택 여부를 먼저 확인하세요. 같은 월세 지원이라도 지자체별로 인정하는 계약 형태와 제출 서류가 다를 수 있습니다."],
      ["중복 수혜 확인", "주거급여, 지자체 월세 지원, 전세·임대료 지원을 이미 받고 있다면 중복 제한이 있는지 공식 공고에서 확인해야 합니다. 예산 소진형 사업은 접수 가능 여부도 함께 봐야 합니다."]
    ],
    related: (item) => item.type === "주거" || /월세|주거|임대|전세|보증금|정착/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["부모와 따로 살아야 신청할 수 있나요?", "정책마다 다릅니다. 일부 사업은 청년 본인의 독립 거주와 임대차 계약을 요구하고, 일부는 가구 소득 기준을 함께 봅니다."],
      ["계약서가 본인 명의가 아니어도 되나요?", "대부분은 본인 명의 계약과 월세 납부 증빙을 중요하게 봅니다. 예외 인정 여부는 공식 공고를 확인해야 합니다."]
    ]
  },
  {
    slug: "youth-job-subsidy-types",
    title: "청년 취업 지원금 종류와 찾는 법",
    description: "청년 취업 지원금, 면접비, 구직활동비, 일경험, 직무교육 지원사업을 종류별로 찾는 방법을 정리했습니다.",
    intro: "청년 취업 지원은 현금성 지원만 있는 것이 아니라 면접비, 구직활동비, 직무교육, 일경험, 인턴십처럼 목적별로 나뉩니다. 본인 상황에 맞는 유형을 먼저 고르면 검색 시간이 줄어듭니다.",
    sections: [
      ["주요 지원 유형", "면접비와 구직활동비는 단기 비용 부담을 줄이는 데 유용하고, 직무교육과 일경험은 취업 준비 과정 자체를 지원합니다. 지역별 청년 일자리 사업은 거주지나 활동 지역 조건을 함께 봐야 합니다."],
      ["찾는 순서", "유형은 취업으로 선택하고 검색어에 면접, 구직, 교육, 인턴, 일경험을 넣어보세요. 신청중과 마감임박 정책을 먼저 확인하면 바로 신청 가능한 사업부터 볼 수 있습니다."]
    ],
    related: (item) => item.type === "취업" || /취업|면접|구직|일경험|인턴|직무|교육|채용/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["재학생도 취업 지원금을 받을 수 있나요?", "사업마다 다릅니다. 졸업예정자나 휴학생을 포함하는 사업도 있고, 미취업 졸업자만 가능한 사업도 있습니다."],
      ["면접비 지원은 여러 번 신청할 수 있나요?", "횟수 제한과 연간 한도가 있는 경우가 많습니다. 면접 증빙 서류와 신청 가능 횟수를 공식 공고에서 확인하세요."]
    ]
  },
  {
    slug: "local-youth-policy-guide",
    title: "지역별 청년 정책 찾는 법",
    description: "서울, 경기 등 지역별 청년 지원사업을 찾을 때 거주지, 활동 지역, 신청 상태, 마감일을 기준으로 좁히는 방법을 정리했습니다.",
    intro: "청년 정책은 전국 공통 사업과 지자체 사업이 섞여 있습니다. 지역 조건을 잘못 보면 신청할 수 없는 정책을 오래 읽게 되므로, 먼저 본인의 거주지와 활동 지역 기준을 나눠 확인하는 것이 좋습니다.",
    sections: [
      ["지역 조건 확인", "주민등록상 주소를 요구하는 사업도 있고, 학교나 직장 소재지, 실제 활동 지역을 인정하는 사업도 있습니다. 서울과 경기처럼 정책 수가 많은 지역은 시·군·구 조건까지 함께 확인해야 합니다."],
      ["빠르게 좁히는 방법", "지역 필터를 먼저 선택한 뒤 신청중, 마감임박 순서로 확인하세요. 이후 주거, 취업, 금융처럼 필요한 유형을 추가하면 실제 신청 가능성이 높은 정책만 남길 수 있습니다."]
    ],
    related: (item) => item.status !== "마감" && Boolean(item.regionGroup || item.region),
    faq: [
      ["전국 정책과 지역 정책은 어떻게 다르나요?", "전국 정책은 지역 제한이 없거나 넓고, 지역 정책은 특정 시·도 또는 시·군·구 거주자를 대상으로 하는 경우가 많습니다."],
      ["이사 예정이면 어느 지역 정책을 봐야 하나요?", "신청일 기준 주민등록지나 실제 거주지 기준이 중요합니다. 이사 예정만으로 신청 가능한지는 공고별로 다릅니다."]
    ]
  },
  {
    slug: "youth-transport-support",
    title: "청년 교통비 지원 정책 모아보기",
    description: "청년 교통비 지원, 대중교통비 지원, 면접 교통비, 통학·출퇴근 지원사업을 신청 상태와 공식 링크 기준으로 확인하세요.",
    intro: "교통비 지원은 금액이 크지 않아 보여도 통학, 출퇴근, 면접 준비가 반복되는 청년에게 체감이 큽니다. 지역, 나이, 이용 교통수단, 신청 기간을 함께 확인하면 바로 신청 가능한 정책을 빠르게 좁힐 수 있습니다.",
    sections: [
      ["먼저 확인할 조건", "대부분의 교통비 지원은 거주지, 나이, 대중교통 이용 실적, 취업 준비 여부를 함께 봅니다. 면접 교통비는 면접 증빙과 신청 횟수 제한을 확인해야 합니다."],
      ["찾는 방법", "유형은 교통 또는 취업을 함께 보고, 검색어에 교통비, 대중교통, 면접, 통학, 출퇴근을 입력하면 관련 정책을 더 쉽게 찾을 수 있습니다."]
    ],
    related: (item) => item.type === "교통" || /교통|대중교통|교통비|통학|출퇴근|면접비|면접/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년 교통비 지원은 현금으로 받나요?", "사업마다 다릅니다. 현금 지급, 포인트, 지역화폐, 교통카드 환급처럼 방식이 다르므로 공식 공고에서 지급 방식을 확인해야 합니다."],
      ["면접 교통비와 일반 교통비 지원을 같이 받을 수 있나요?", "중복 수혜 제한은 사업별로 다릅니다. 같은 지자체의 유사 지원을 받고 있다면 공식 공고의 중복 제한을 먼저 확인하세요."]
    ]
  },
  {
    slug: "youth-startup-grant",
    title: "청년 창업 지원금·창업 지원사업 찾는 법",
    description: "청년 창업 지원금, 예비창업자 지원, 창업 교육, 사업화 자금, 지역 정착 창업 지원사업을 공식 링크 기준으로 확인하세요.",
    intro: "청년 창업 지원은 단순 지원금뿐 아니라 창업 교육, 공간, 멘토링, 사업화 자금, 지역 정착 지원으로 나뉩니다. 창업 단계와 지역 조건을 먼저 나누면 본인에게 맞는 정책을 더 빨리 찾을 수 있습니다.",
    sections: [
      ["먼저 확인할 조건", "예비창업자인지, 창업 후 몇 년 이내인지, 사업장 소재지가 어디인지, 업종 제한이 있는지 확인해야 합니다. 일부 사업은 팀 구성이나 지역 이전 조건을 요구합니다."],
      ["찾는 방법", "유형은 창업으로 선택하고, 검색어에 예비창업, 사업화, 창업교육, 창업공간, 지역정착을 넣어보세요. 마감임박 사업은 모집 인원과 제출 서류를 먼저 확인해야 합니다."]
    ],
    related: (item) => item.type === "창업" || /창업|예비창업|사업화|스타트업|창업공간|지역정착/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["사업자등록 전에도 청년 창업 지원금을 신청할 수 있나요?", "예비창업자를 대상으로 하는 사업은 가능할 수 있습니다. 반대로 초기창업자만 가능한 사업도 있으니 창업 단계 기준을 확인해야 합니다."],
      ["창업 지원사업은 지역 제한이 있나요?", "지역 정착형 창업 지원은 거주지나 사업장 소재지 조건이 붙는 경우가 많습니다. 공고의 지역 조건과 이전 조건을 꼭 확인하세요."]
    ]
  },
  {
    slug: "youth-mental-health-support",
    title: "청년 마음건강 지원·상담 지원사업 모아보기",
    description: "청년 마음건강 지원, 심리상담, 정신건강, 고립·은둔 청년 지원사업을 신청 기간과 공식 링크 기준으로 확인하세요.",
    intro: "마음건강 지원은 심리상담, 검사, 집단 프로그램, 고립·은둔 청년 지원처럼 형태가 다양합니다. 거주지와 신청 가능 인원, 선착순 여부를 먼저 확인하면 놓치는 정책을 줄일 수 있습니다.",
    sections: [
      ["먼저 확인할 조건", "상담 지원은 지역 거주 조건, 나이, 상담 횟수, 본인 부담금 여부가 중요합니다. 선착순 모집은 신청 시작 시각과 제출 방식까지 확인해야 합니다."],
      ["찾는 방법", "유형은 복지 또는 교육까지 함께 보고, 검색어에 마음건강, 심리상담, 정신건강, 고립, 은둔을 입력해보세요."]
    ],
    related: (item) => item.type === "복지" && /마음|심리|상담|정신건강|고립|은둔/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년 마음건강 지원은 병원 진료와 같은 건가요?", "대부분은 상담, 검사, 프로그램 지원이며 의료 진료와는 다를 수 있습니다. 필요한 경우 공식 기관 안내에 따라 전문 의료기관을 확인해야 합니다."],
      ["상담 내용이 공개되나요?", "상담 정보 처리 방식은 운영기관의 개인정보처리방침을 따릅니다. 민감한 정보가 포함될 수 있으므로 신청 전 개인정보 처리 내용을 확인하세요."]
    ]
  },
  {
    slug: "youth-finance-savings-support",
    title: "청년 금융·저축 지원 정책 모아보기",
    description: "청년 금융 지원, 저축 지원, 자산형성, 대출이자 지원, 생활안정 자금 정책을 신청 조건과 공식 링크 기준으로 확인하세요.",
    intro: "금융·저축 지원은 자산형성, 대출이자, 생활안정 자금, 신용회복처럼 목적이 다릅니다. 소득 기준과 중복 수혜 제한이 중요하므로 신청 전 자격 조건을 꼼꼼히 봐야 합니다.",
    sections: [
      ["먼저 확인할 조건", "소득, 재산, 근로 여부, 기존 금융지원 수혜 여부가 자주 쓰입니다. 저축 지원은 본인 납입 조건과 유지 기간을 함께 확인해야 합니다."],
      ["찾는 방법", "유형은 금융으로 선택하고, 검색어에 저축, 자산형성, 대출이자, 생활안정, 신용을 넣어보세요. 신청중과 마감임박 정책을 먼저 보면 바로 접수 가능한 사업을 찾기 쉽습니다."]
    ],
    related: (item) => item.type === "금융" || /저축|자산|금융|대출|이자|생활안정|신용/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년 금융 지원은 누구나 신청할 수 있나요?", "대부분 소득, 거주지, 근로 여부, 기존 수혜 여부를 봅니다. 지원금 성격인지 대출·이자 지원인지도 공고별로 다릅니다."],
      ["저축 지원은 중도 해지하면 어떻게 되나요?", "사업마다 환수나 지원금 미지급 기준이 다릅니다. 납입 기간, 유지 조건, 해지 시 불이익을 공식 공고에서 확인해야 합니다."]
    ]
  }
];

function assertInsideRoot(target) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(rootDir + path.sep)) {
    throw new Error(`Refusing to write outside site root: ${resolved}`);
  }
}

function resetDir(name) {
  const dir = path.join(rootDir, name);
  assertInsideRoot(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writePage(relativePath, html) {
  const target = path.join(rootDir, relativePath);
  assertInsideRoot(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, "utf8");
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function safeUrl(value) {
  const url = String(value || "");
  return /^https?:\/\//.test(url) ? url : "";
}

function statusClass(status) {
  if (status === "마감") return " closed";
  if (status === "예정") return " scheduled";
  if (status === "마감임박") return " closing-soon";
  return "";
}

function teaser(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 95 ? `${text.slice(0, 95)}...` : text;
}

function displayPeriod(item) {
  return String(item?.period || "").trim() || "공식 공고 확인";
}

function policySeoTitle(item) {
  const title = String(item.title || "청년지원사업");
  if ((policyTitleCounts.get(title) || 0) <= 1) return title;
  const region = item.regionGroup || item.region || "전국";
  return `${title} - ${region} 정책 ${String(item.id || "").slice(-6)}`;
}

function trimMeta(value, max = 155) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function absoluteUrl(urlPath = "/") {
  const urlPathText = String(urlPath || "/");
  if (/^https?:\/\//.test(urlPathText)) return urlPathText;
  return `${siteUrl}${urlPathText.startsWith("/") ? urlPathText : `/${urlPathText}`}`;
}

function seoHead({ title, description, path: pagePath = "/", type = "website", robots = "index, follow" }) {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const metaDescription = trimMeta(description);
  const canonicalUrl = absoluteUrl(pagePath);
  const robotsContent = robots.includes("noindex")
    ? robots
    : `${robots}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`;
  return `  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(metaDescription)}">
  <meta name="robots" content="${esc(robotsContent)}">
  <link rel="canonical" href="${esc(canonicalUrl)}">
  <meta property="og:site_name" content="${esc(siteName)}">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(metaDescription)}">
  <meta property="og:image" content="${esc(defaultOgImage)}">
  <meta property="og:image:alt" content="청년 혜택과 청년 지원사업을 찾는 청년혜택.zip">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta property="og:type" content="${esc(type)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(fullTitle)}">
  <meta name="twitter:description" content="${esc(metaDescription)}">
  <meta name="twitter:image" content="${esc(defaultOgImage)}">`;
}

function jsonLd(data) {
  return `  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

function itemListSchema(name, description, items, itemUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title || item.name,
      url: absoluteUrl(itemUrl(item))
    }))
  };
}

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/assets/favicon.png`,
    sameAs: [blogUrl]
  };
}

function footer() {
  return `  <footer class="site-footer">
    <nav class="footer-links" aria-label="사이트 안내">
      <a href="/about/">소개</a>
      <a href="/editorial-policy/">편집 방침</a>
      <a href="/sources/">자료·이미지 출처</a>
      <a href="/notice/">면책·공지</a>
      <a href="/privacy/">개인정보처리방침</a>
      <a href="/contact/">연락처</a>
      <a href="${blogUrl}/" target="_blank" rel="noopener">블로그</a>
    </nav>
    <p>본 사이트는 광고·제휴 수익으로 운영될 수 있습니다. 게시 정보는 공식 공고 기준이며 변동될 수 있습니다. © 2026 청년혜택.zip</p>
  </footer>`;
}

function pageShell({ title, description, body, path: pagePath = "/", type = "website", robots = "index, follow", schema = [] }) {
  const schemas = [organizationSchema(), ...schema];
  const schemaTags = schemas.length ? `\n${schemas.map(jsonLd).join("\n")}` : "";
  const pageScripts = [
    pagePath.startsWith("/policy/") ? `\n  <script src="/assets/saved.js" defer></script>` : "",
    pagePath === "/calendar/" ? `\n  <script src="/assets/calendar.js" defer></script>` : ""
  ].join("");
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
${seoHead({ title, description, path: pagePath, type, robots })}
${schemaTags}
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="512x512" href="/assets/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/" aria-label="청년혜택.zip 홈">
      <img class="brand-mark" src="/assets/apple-touch-icon.png" alt="" width="42" height="42" aria-hidden="true">
      <span class="brand-copy">
        <strong>청년혜택.zip</strong>
        <span>청년지원사업 찾기</span>
      </span>
    </a>
    <nav class="top-nav" aria-label="주요 메뉴">
      <a href="/calendar/">마감 캘린더</a>
      <a href="/guides/">가이드</a>
    </nav>
  </header>
  <main class="content-page">
${body}
  </main>
${footer()}
${pageScripts}
</body>
</html>
`;
}

function metaRows(item) {
  return [
    ["지원내용", item.support],
    ["신청기간", displayPeriod(item)],
    ["대상연령", item.age],
    ["소득/조건", item.income],
    ["지역/거주", item.residence],
    ["분야", item.type],
    ["상태", item.status]
  ].filter(([, value]) => value).map(([label, value]) => `
          <div>
            <dt>${esc(label)}</dt>
            <dd>${esc(value)}</dd>
          </div>`).join("");
}

function policyCard(item) {
  const official = safeUrl(item.officialUrl);
  const isClosingSoon = item.status === "마감임박";
  return `
        <article class="policy-card compact type-${typeSlug(item)}${isClosingSoon ? " is-closing-soon" : ""}">
          <div class="labels">
            <span>${esc(item.regionGroup || item.region)}</span>
            <span>${esc(item.type)}</span>
            <b class="status${statusClass(item.status)}">${esc(item.status)}</b>
          </div>
          <h3><a href="/policy/${encodeURIComponent(item.id)}/">${esc(item.title)}</a></h3>
          <p class="summary">${esc(teaser(item.summary || item.support))}</p>
          <dl class="meta brief">
            <div><dt>기간</dt><dd>${esc(displayPeriod(item))}</dd></div>
          </dl>
          <div class="card-actions static-card-actions">
            <a class="link-button" href="/policy/${encodeURIComponent(item.id)}/">상세보기</a>
            ${official ? `<a class="link-button primary" href="${esc(official)}" target="_blank" rel="noopener noreferrer">공식 링크</a>` : ""}
          </div>
        </article>`;
}

function contentMeta() {
  return `      <div class="content-meta" aria-label="콘텐츠 작성 및 검수 정보">
        <span>정리: 청년혜택.zip 편집팀</span>
        <span>자료 기준일: <time datetime="${esc(contentDate)}">${esc(contentDate)}</time></span>
        <a href="/editorial-policy/">정보 검수 방식</a>
      </div>`;
}

function homePolicyRank(item) {
  return { "마감임박": 0, "신청중": 1, "예정": 2 }[item.status] ?? 3;
}

function homePolicies() {
  return [...indexablePolicies]
    .sort((a, b) => homePolicyRank(a) - homePolicyRank(b) ||
      String(a.endDate || "9999-12-31").localeCompare(String(b.endDate || "9999-12-31")) ||
      collator.compare(a.title || "", b.title || ""))
    .slice(0, 30);
}

function syncHomeIndex() {
  const homePath = path.join(rootDir, "index.html");
  const cardStart = "<!-- HOME_POLICY_STATIC_START -->";
  const cardEnd = "<!-- HOME_POLICY_STATIC_END -->";
  const schemaStart = "<!-- HOME_ITEMLIST_SCHEMA_START -->";
  const schemaEnd = "<!-- HOME_ITEMLIST_SCHEMA_END -->";
  const featured = homePolicies();
  let html = fs.readFileSync(homePath, "utf8");

  for (const marker of [cardStart, cardEnd, schemaStart, schemaEnd]) {
    if (!html.includes(marker)) throw new Error(`Missing home generation marker: ${marker}`);
  }

  const cards = featured.map(policyCard).join("");
  const schema = jsonLd(itemListSchema(
    "현재 확인할 청년지원사업",
    "신청중, 마감임박, 신청예정 청년지원사업 중 먼저 확인할 정책 목록입니다.",
    featured,
    (item) => `/policy/${encodeURIComponent(item.id)}/`
  ));
  html = html.replace(new RegExp(`${cardStart}[\\s\\S]*?${cardEnd}`), () => `${cardStart}\n${cards}\n      ${cardEnd}`);
  html = html.replace(new RegExp(`${schemaStart}[\\s\\S]*?${schemaEnd}`), () => `${schemaStart}\n${schema}\n  ${schemaEnd}`);
  fs.writeFileSync(homePath, html, "utf8");
}

function sortPolicies(items) {
  return [...items].sort((a, b) =>
    collator.compare(a.regionGroup || a.region || "", b.regionGroup || b.region || "") ||
    collator.compare(a.type || "", b.type || "") ||
    collator.compare(a.title || "", b.title || "")
  );
}

function relatedPolicies(item) {
  const itemRegion = item.regionGroup || item.region || "";
  return policies
    .filter((candidate) => candidate.id !== item.id && candidate.status !== "마감")
    .map((candidate) => ({
      candidate,
      score:
        (candidate.type === item.type ? 3 : 0) +
        ((candidate.regionGroup || candidate.region || "") === itemRegion ? 2 : 0) +
        (candidate.status === "마감임박" ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || collator.compare(a.candidate.title || "", b.candidate.title || ""))
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

function makeDetail(item) {
  const official = safeUrl(item.officialUrl);
  const related = relatedPolicies(item);
  const detailPath = `/policy/${encodeURIComponent(item.id)}/`;
  const description = trimMeta(`${item.regionGroup || item.region || "전국"} ${item.type || "청년"} 정책(${item.id}): ${item.title}. 신청기간 ${displayPeriod(item)}, 지원내용, 대상 조건과 공식 링크를 확인하세요.`);
  const body = `    <article class="detail-page type-${typeSlug(item)}">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <div class="labels">
        <span>${esc(item.regionGroup || item.region)}</span>
        <span>${esc(item.type)}</span>
        <b class="status${statusClass(item.status)}">${esc(item.status)}</b>
      </div>
      <h1 class="page-title">${esc(item.title)}</h1>
      <p class="detail-summary">${esc(item.summary || item.support)}</p>
${contentMeta()}

      <section class="detail-section">
        <h2>핵심 정보</h2>
        <dl class="info-table">${metaRows(item)}
        </dl>
      </section>

      <section class="detail-section">
        <h2>확인할 것</h2>
        <p>신청 전 모집 공고의 접수 기간, 세부 자격, 제출 서류를 공식 페이지에서 다시 확인하세요.</p>
      </section>

      <section class="detail-section">
        <h2>함께 볼 정책</h2>
        <div class="related-links">${related.map((candidate) => `<a class="related-link" href="/policy/${encodeURIComponent(candidate.id)}/"><span>${esc(candidate.regionGroup || candidate.region)} · ${esc(candidate.type)}</span><strong>${esc(candidate.title)}</strong></a>`).join("")}</div>
      </section>

      <div class="detail-actions">
        <button class="link-button favorite-button" type="button" data-favorite-button data-policy-id="${esc(item.id)}" aria-pressed="false">♡ 이 정책 찜하기</button>
        ${official ? `<a class="link-button primary" href="${esc(official)}" target="_blank" rel="noopener noreferrer">공식 사이트에서 확인</a>` : ""}
        <a class="link-button" href="/region/${regionSlug(item)}/">${esc(item.regionGroup || item.region)} 정책 더보기</a>
        <a class="link-button" href="/type/${typeSlug(item)}/">${esc(item.type)} 정책 더보기</a>
      </div>

      <p class="source-footnote">온통청년 정책 데이터와 공식 공고를 기준으로 정리했습니다. 실제 신청은 반드시 공식 링크에서 최종 확인하고, 정리 방식은 <a href="/editorial-policy/">편집 방침</a>에서 확인하세요.</p>
    </article>`;

  writePage(`policy/${encodeURIComponent(item.id)}/index.html`, pageShell({
    title: policySeoTitle(item),
    description,
    body,
    path: detailPath,
    type: "article",
    robots: item.status === "마감" ? "noindex, follow" : "index, follow",
    schema: [
      breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: item.regionGroup || item.region || "청년지원사업", path: `/region/${regionSlug(item)}/` },
        { name: item.title, path: detailPath }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: policySeoTitle(item),
        description,
        image: defaultOgImage,
        url: absoluteUrl(detailPath),
        datePublished: contentDate,
        dateModified: contentDate,
        author: {
          "@type": "Organization",
          name: `${siteName} 편집팀`,
          url: absoluteUrl("/about/")
        },
        isBasedOn: official || undefined,
        publisher: {
          "@type": "Organization",
          name: siteName,
          url: siteUrl
        },
        mainEntityOfPage: absoluteUrl(detailPath)
      },
      {
        "@context": "https://schema.org",
        "@type": "GovernmentService",
        name: policySeoTitle(item),
        description,
        url: absoluteUrl(detailPath),
        serviceType: `${item.type || "청년"} 청년지원사업`,
        areaServed: item.regionGroup || item.region || "전국",
        audience: {
          "@type": "Audience",
          audienceType: "청년"
        },
        sameAs: official || undefined
      },
      itemListSchema(
        `${policySeoTitle(item)} 관련 정책`,
        "같은 유형과 지역에서 함께 확인할 수 있는 청년지원사업입니다.",
        related,
        (candidate) => `/policy/${encodeURIComponent(candidate.id)}/`
      )
    ]
  }));
}

function optionIndex(kind, heading, description, options) {
  const links = options.map(([slug, label]) => {
    const href = `/${kind}/${slug}/`;
    const count = countFor(kind, label);
    return `<a class="category-link" href="${href}"><strong>${esc(label)}</strong><span>${count.toLocaleString("ko-KR")}개</span></a>`;
  }).join("");
  writePage(`${kind}/index.html`, pageShell({
    title: heading,
    description,
    path: `/${kind}/`,
    schema: [
      breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: heading, path: `/${kind}/` }
      ]),
      itemListSchema(
        heading,
        description,
        options.map(([slug, label]) => ({ slug, name: label })),
        (item) => `/${kind}/${item.slug}/`
      )
    ],
    body: `    <section class="list-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <h1 class="page-title">${esc(heading)}</h1>
      <p class="detail-summary">${esc(description)}</p>
      <div class="category-grid">${links}</div>
    </section>`
  }));
}

function countFor(kind, label) {
  if (label === "전체") return indexablePolicies.length;
  if (kind === "region") return filterRegion(indexablePolicies, label).length;
  if (kind === "type") return indexablePolicies.filter((item) => item.type === label).length;
  if (kind === "status") return policies.filter((item) => item.status === label).length;
  return 0;
}

function regionSlug(item) {
  const label = item.regionGroup || item.region || "전체";
  return regions.find(([, value]) => value === label)?.[0] || "all";
}

function typeSlug(item) {
  return types.find(([, value]) => value === item.type)?.[0] || "all";
}

function filterRegion(items, label) {
  return items.filter((item) => {
    const regions = Array.isArray(item.regions) ? item.regions : [];
    if (regions.length) return regions.includes(label);
    return item.regionGroup === label ||
      item.city === label ||
      String(item.region || "").includes(label);
  });
}

function listPage(kind, slug, label, items) {
  const sorted = sortPolicies(items);
  const visible = sorted.slice(0, 60);
  const omitted = sorted.length - visible.length;
  const queryKey = { region: "region", type: "type", status: "status" }[kind];
  const filterHref = label === "전체" ? "/" : `/?${queryKey}=${encodeURIComponent(label)}`;
  const kindLabels = { region: "지역별", type: "유형별", status: "상태별" };
  const pageTitle = label === "전체" ? `${kindLabels[kind]} 전체 청년지원사업` : `${label} 청년지원사업`;
  const pageDescription = label === "전체"
    ? `${kindLabels[kind]} 전체 청년 지원금, 청년 정책, 청년지원사업 목록입니다. 신청기간과 공식 링크를 확인하세요.`
    : `${label} 조건에 맞는 청년 지원금, 청년 정책, 청년지원사업 목록입니다. 신청기간과 공식 링크를 확인하세요.`;
  const body = `    <section class="list-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <p class="eyebrow">${kind}</p>
      <h1 class="page-title">${esc(pageTitle)}</h1>
      <p class="detail-summary">${sorted.length.toLocaleString("ko-KR")}개 정책을 한눈에 확인할 수 있게 묶었습니다.</p>
      <div class="card-grid list-grid">${visible.map(policyCard).join("")}</div>
      ${omitted > 0 ? `<div class="list-more-note"><p>페이지 속도를 위해 우선 ${visible.length.toLocaleString("ko-KR")}개를 표시합니다.</p><a class="link-button primary" href="${filterHref}">메인 필터에서 ${sorted.length.toLocaleString("ko-KR")}개 모두 보기</a></div>` : ""}
    </section>`;
  writePage(`${kind}/${slug}/index.html`, pageShell({
    title: pageTitle,
    description: pageDescription,
    body,
    path: `/${kind}/${slug}/`,
    robots: slug !== "all" && !(kind === "status" && slug === "closed") ? "index, follow" : "noindex, follow",
    schema: [
      breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: kindLabels[kind], path: `/${kind}/` },
        { name: pageTitle, path: `/${kind}/${slug}/` }
      ]),
      itemListSchema(
        pageTitle,
        pageDescription,
        visible,
        (item) => `/policy/${encodeURIComponent(item.id)}/`
      )
    ]
  }));
}

function writeStaticPages() {
  for (const page of staticPages) {
    const paragraphs = page.body.map((text) => `<p class="detail-summary">${esc(text)}</p>`).join("\n      ");
    const contactAction = page.slug === "contact"
      ? `<p><a class="link-button primary" href="${blogUrl}/" target="_blank" rel="noopener noreferrer">블로그에서 문의하기</a></p>`
      : "";
    writePage(`${page.slug}/index.html`, pageShell({
      title: page.title,
      description: page.description,
      path: `/${page.slug}/`,
      schema: [breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: page.title, path: `/${page.slug}/` }
      ])],
      body: `    <article class="detail-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <h1 class="page-title">${esc(page.title)}</h1>
      ${paragraphs}
      ${contactAction}
    </article>`
    }));
  }
}

function guideCard(guide) {
  return `<a class="category-link guide-link" href="/guides/${guide.slug}/"><strong>${esc(guide.title)}</strong><span>보기</span></a>`;
}

function guideFaqSchema(guide) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };
}

function makeGuideIndex() {
  const body = `    <section class="list-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <p class="eyebrow">Guides</p>
      <h1 class="page-title">청년 혜택 검색 가이드</h1>
      <p class="detail-summary">청년 월세 지원, 청년 취업 지원, 서울 청년 지원금, 경기도 청년 지원금처럼 검색 수요가 큰 주제를 따로 정리했습니다.</p>
      <div class="category-grid guide-grid">${guides.map(guideCard).join("")}</div>
    </section>`;
  writePage("guides/index.html", pageShell({
    title: "청년 혜택 검색 가이드",
    description: "청년 월세 지원, 청년 취업 지원, 서울 청년 지원금, 경기도 청년 지원금을 주제별로 쉽게 찾아보세요.",
    body,
    path: "/guides/",
    schema: [
      breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: "청년 혜택 검색 가이드", path: "/guides/" }
      ]),
      itemListSchema(
        "청년 혜택 검색 가이드",
        "청년 지원금과 청년 정책을 주제별로 찾을 수 있는 가이드 목록입니다.",
        guides.map((guide) => ({ title: guide.title, slug: guide.slug })),
        (guide) => `/guides/${guide.slug}/`
      )
    ]
  }));
}

function makeGuide(guide) {
  const guidePath = `/guides/${guide.slug}/`;
  const related = sortPolicies(policies.filter(guide.related)).slice(0, 12);
  const sections = guide.sections.map(([heading, text]) => `      <section class="detail-section">
        <h2>${esc(heading)}</h2>
        <p>${esc(text)}</p>
      </section>`).join("\n");
  const faq = guide.faq.map(([question, answer]) => `        <article>
          <h3>${esc(question)}</h3>
          <p>${esc(answer)}</p>
        </article>`).join("\n");
  const body = `    <article class="detail-page guide-page">
      <a class="back-link" href="/guides/">← 가이드 목록으로 돌아가기</a>
      <p class="eyebrow">Guide</p>
      <h1 class="page-title">${esc(guide.title)}</h1>
      <p class="detail-summary">${esc(guide.intro)}</p>
${contentMeta()}
${sections}
      <section class="detail-section">
        <h2>관련 청년지원사업</h2>
        <p>${related.length.toLocaleString("ko-KR")}개 정책을 먼저 추려봤습니다. 실제 신청 전에는 상세 페이지와 공식 링크에서 최신 공고를 확인하세요.</p>
        <div class="card-grid list-grid">${related.map(policyCard).join("")}</div>
      </section>
      <section class="detail-section faq-section">
        <h2>자주 묻는 질문</h2>
        <div class="faq-list">${faq}</div>
      </section>
      <p class="source-footnote">정책 데이터와 공식 공고를 바탕으로 편집팀이 주제별로 정리했습니다. 지원 조건은 바뀔 수 있으므로 신청 전 공식 링크를 확인하세요. <a href="/editorial-policy/">편집 기준 보기</a></p>
    </article>`;
  writePage(`guides/${guide.slug}/index.html`, pageShell({
    title: guide.title,
    description: guide.description,
    body,
    path: guidePath,
    type: "article",
    schema: [
      breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: "청년 혜택 검색 가이드", path: "/guides/" },
        { name: guide.title, path: guidePath }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        url: absoluteUrl(guidePath),
        dateModified: contentDate,
        author: {
          "@type": "Organization",
          name: `${siteName} 편집팀`,
          url: absoluteUrl("/about/")
        },
        publisher: {
          "@type": "Organization",
          name: siteName,
          url: siteUrl
        },
        mainEntityOfPage: absoluteUrl(guidePath)
      },
      guideFaqSchema(guide),
      itemListSchema(
        `${guide.title} 관련 정책`,
        guide.description,
        related,
        (item) => `/policy/${encodeURIComponent(item.id)}/`
      )
    ]
  }));
}

function writeGuides() {
  makeGuideIndex();
  for (const guide of guides) makeGuide(guide);
}

function koreaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function calendarMonthKeys(count = 6) {
  const [year, month] = koreaDateKey().split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function calendarMonth(monthKey, isActive = false) {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const todayKey = koreaDateKey();
  const events = policies
    .filter((item) => item.status !== "마감" && item.endDate?.startsWith(monthKey) && item.endDate >= todayKey)
    .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)) || collator.compare(a.title || "", b.title || ""));
  const byDate = new Map();
  for (const item of events) {
    if (!byDate.has(item.endDate)) byDate.set(item.endDate, []);
    byDate.get(item.endDate).push(item);
  }
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
    .map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
  const blanks = Array.from({ length: firstWeekday }, () => `<div class="calendar-day is-empty" aria-hidden="true"></div>`).join("");
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
    const dayEvents = byDate.get(dateKey) || [];
    const isToday = dateKey === todayKey;
    const isClosingWeek = dayEvents.some((item) => {
      const diffDays = Math.ceil((new Date(`${item.endDate}T00:00:00`) - new Date(`${todayKey}T00:00:00`)) / 86400000);
      return diffDays >= 0 && diffDays <= 7;
    });
    const dayClass = [
      "calendar-day",
      isToday ? "is-today" : "",
      isClosingWeek ? "is-closing-week" : ""
    ].filter(Boolean).join(" ");
    const visible = dayEvents.slice(0, 3).map((item) =>
      `<a class="calendar-event type-${typeSlug(item)}" href="/policy/${encodeURIComponent(item.id)}/" title="${esc(item.title)}">${esc(item.title)}</a>`
    ).join("");
    const more = dayEvents.length > 3
      ? `<button class="calendar-more" type="button" data-agenda-target="agenda-${dateKey}">${dayEvents.length}개 전체 목록</button>`
      : "";
    const mobileCount = dayEvents.length
      ? `<button class="calendar-day-count" type="button" data-agenda-target="agenda-${dateKey}" aria-label="${year}년 ${month}월 ${day}일 마감 정책 ${dayEvents.length}개 보기">${dayEvents.length}개</button>`
      : "";
    return `<div class="${dayClass}"><span class="calendar-date">${day}</span>${visible}${more}${mobileCount}</div>`;
  }).join("");
  const agenda = events.length
    ? [...byDate.entries()].map(([dateKey, items]) => `        <section class="agenda-day" id="agenda-${dateKey}">
          <h3>${Number(dateKey.slice(-2))}일 · ${items.length}개 마감</h3>
          ${items.map((item) => `<a href="/policy/${encodeURIComponent(item.id)}/" data-type="${esc(item.type || "기타")}">${esc(item.title)}</a>`).join("\n          ")}
        </section>`).join("\n")
    : `        <p class="empty">확인된 마감 일정이 없습니다.</p>`;
  return `      <section class="calendar-month" id="month-${monthKey}" role="tabpanel" aria-labelledby="tab-${monthKey}"${isActive ? "" : " hidden"}>
        <h2>${year}년 ${month}월</h2>
        <div class="calendar-grid" aria-label="${year}년 ${month}월 정책 마감 일정">${weekdays}${blanks}${days}</div>
        <div class="calendar-agenda">${agenda}</div>
      </section>`;
}

function writeCalendar() {
  const months = calendarMonthKeys();
  const monthNav = months.map((monthKey, index) => {
    const [year, month] = monthKey.split("-").map(Number);
    const selected = index === 0;
    return `<button id="tab-${monthKey}" type="button" role="tab" aria-controls="month-${monthKey}" aria-selected="${selected}" tabindex="${selected ? "0" : "-1"}" class="${selected ? "is-active" : ""}" data-month-target="month-${monthKey}">${year}년 ${month}월</button>`;
  }).join("");
  const body = `    <article class="detail-page calendar-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <h1 class="page-title">청년지원사업 마감 캘린더</h1>
      <p class="detail-summary">신청 가능한 청년 정책의 마감일을 월별로 확인하세요. 일정은 변동될 수 있으므로 신청 전 공식 공고를 다시 확인해야 합니다.</p>
      <nav class="month-nav" aria-label="월 선택" role="tablist">${monthNav}</nav>
${months.map((monthKey, index) => calendarMonth(monthKey, index === 0)).join("\n")}
      <dialog class="calendar-dialog" data-calendar-dialog aria-labelledby="calendar-dialog-title">
        <div class="calendar-dialog-head">
          <h2 id="calendar-dialog-title" data-calendar-dialog-title>마감 정책</h2>
          <button class="calendar-dialog-close" type="button" data-calendar-dialog-close aria-label="팝업 닫기">×</button>
        </div>
        <div class="calendar-dialog-list" data-calendar-dialog-list></div>
      </dialog>
    </article>`;
  writePage("calendar/index.html", pageShell({
    title: "청년지원사업 마감 캘린더",
    description: "청년 지원금, 청년 월세 지원, 취업·주거 지원사업의 신청 마감일을 월별 캘린더에서 확인하세요.",
    body,
    path: "/calendar/",
    schema: [breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "청년지원사업 마감 캘린더", path: "/calendar/" }
    ])]
  }));
}

function sitemapEntry(url, priority = "0.7") {
  const lastmod = payload.updatedAt || new Date().toISOString().slice(0, 10);
  return `  <url>
    <loc>${esc(siteUrl + url)}</loc>
    <lastmod>${esc(lastmod)}</lastmod>
    <priority>${priority}</priority>
  </url>`;
}

function writeSitemap() {
  const coreUrls = [
    sitemapEntry("/", "1.0"),
    sitemapEntry("/region/", "0.8"),
    sitemapEntry("/type/", "0.8"),
    sitemapEntry("/status/", "0.8"),
    sitemapEntry("/guides/", "0.8"),
    sitemapEntry("/calendar/", "0.8"),
    ...regions.filter(([slug]) => slug !== "all").map(([slug]) => sitemapEntry(`/region/${slug}/`, "0.7")),
    ...types.filter(([slug]) => slug !== "all").map(([slug]) => sitemapEntry(`/type/${slug}/`, "0.7")),
    ...statuses.filter(([slug]) => !["all", "closed"].includes(slug)).map(([slug]) => sitemapEntry(`/status/${slug}/`, "0.7")),
    ...guides.map((guide) => sitemapEntry(`/guides/${guide.slug}/`, "0.75")),
    ...staticPages.map((page) => sitemapEntry(`/${page.slug}/`, "0.5"))
  ];
  const urls = [
    ...coreUrls,
    ...indexablePolicies.map((item) => sitemapEntry(`/policy/${encodeURIComponent(item.id)}/`, "0.6"))
  ];
  writePage("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`);
  writePage("sitemap-static.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreUrls.join("\n")}
</urlset>
`);
  writePage("sitemap.txt", `${[
    `${siteUrl}/`,
    `${siteUrl}/region/`,
    `${siteUrl}/type/`,
    `${siteUrl}/status/`,
    `${siteUrl}/guides/`,
    `${siteUrl}/calendar/`,
    ...regions.filter(([slug]) => slug !== "all").map(([slug]) => `${siteUrl}/region/${slug}/`),
    ...types.filter(([slug]) => slug !== "all").map(([slug]) => `${siteUrl}/type/${slug}/`),
    ...statuses.filter(([slug]) => !["all", "closed"].includes(slug)).map(([slug]) => `${siteUrl}/status/${slug}/`),
    ...guides.map((guide) => `${siteUrl}/guides/${guide.slug}/`),
    ...staticPages.map((page) => `${siteUrl}/${page.slug}/`)
  ].join("\n")}
`);
  writePage("robots.txt", `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/sitemap-static.xml
`);
  writePage("_headers", `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/sitemap.xml
  Content-Type: application/xml; charset=utf-8

/sitemap-static.xml
  Content-Type: application/xml; charset=utf-8

/sitemap.txt
  Content-Type: text/plain; charset=utf-8

/robots.txt
  Content-Type: text/plain; charset=utf-8

/manifest.webmanifest
  Content-Type: application/manifest+json; charset=utf-8
  Cache-Control: no-cache

/sw.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: no-cache

/data/*
  Cache-Control: public, max-age=1800
`);
}

function writeAppData() {
  const appPolicies = indexablePolicies.map((item) => ({
    id: item.id,
    title: item.title,
    region: item.regionGroup || item.region || "전국",
    regions: Array.isArray(item.regions) ? item.regions : [],
    city: item.city || "",
    type: item.type || "기타",
    status: item.status || "신청중",
    startDate: item.startDate || "",
    endDate: item.endDate || "",
    period: item.period || displayPeriod(item),
    summary: teaser(item.summary || item.support)
  }));

  writePage("data/app/index.json", JSON.stringify({
    version: 1,
    updatedAt: contentDate,
    count: appPolicies.length,
    policies: appPolicies
  }));

  for (const item of policies) {
    writePage(`data/app/policy/${encodeURIComponent(item.id)}.json`, JSON.stringify({
      ...item,
      region: item.regionGroup || item.region || "전국",
      period: item.period || displayPeriod(item),
      officialUrl: safeUrl(item.officialUrl),
      webUrl: absoluteUrl(`/policy/${encodeURIComponent(item.id)}/`),
      updatedAt: contentDate
    }));
  }
}

for (const dir of generatedDirs) resetDir(dir);
for (const item of policies) makeDetail(item);
writeAppData();

optionIndex("region", "지역별 청년지원사업", "살고 있거나 신청하려는 지역 기준으로 정책을 찾습니다.", regions);
optionIndex("type", "유형별 청년지원사업", "주거, 취업, 금융처럼 필요한 지원 분야 기준으로 정책을 찾습니다.", types);
optionIndex("status", "상태별 청년지원사업", "신청 가능 여부와 일정 기준으로 정책을 찾습니다.", statuses);

for (const [slug, label] of regions) {
  const items = label === "전체" ? indexablePolicies : filterRegion(indexablePolicies, label);
  listPage("region", slug, label, items);
}

for (const [slug, label] of types) {
  const items = label === "전체" ? indexablePolicies : indexablePolicies.filter((item) => item.type === label);
  listPage("type", slug, label, items);
}

for (const [slug, label] of statuses) {
  const items = label === "전체" ? indexablePolicies : policies.filter((item) => item.status === label);
  listPage("status", slug, label, items);
}

writeStaticPages();
writeGuides();
writeCalendar();
syncHomeIndex();
writeSitemap();

console.log(`Generated ${policies.length} policy pages (${indexablePolicies.length} indexable), ${regions.length + types.length + statuses.length + 3} category pages, ${guides.length + 1} guide pages, calendar, sitemap.xml, and robots.txt.`);
