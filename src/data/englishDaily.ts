// 本文件由 doc/ 下 PDF 文件自动提取生成，请勿手改
// 包含：打卡原文 + 参考译文 + 长难句解析（单词、切分、语法、逐句译文）

export interface EnglishDaySentence {
  num: string
  en: string
  ref: string
  // 预生成的 AI 解析内容（句子主干/结构/搭配），由 scripts/gen-ai-analysis.cjs 批量生成，避免运行时消耗 AI token
  ai?: {
    backbone: string
    structure: string[]
    collocations: string[]
  }
}

export interface VocabItem {
  raw: string
  word: string
  meaning: string
}

export interface AnalysisItem {
  sentNum: string
  vocab: VocabItem[]
  split: string
  grammar: string[]
  ref: string
}

export interface EnglishDay {
  day: number
  type: '英一' | '英二'
  source: string
  sentences: EnglishDaySentence[]
  zh: string
  analysis?: AnalysisItem[]
}

export const ENGLISH_DAILY: EnglishDay[] = [
  {
    day: 1,
    type: "英一",
    source: "2005 Text 1",
    zh: "人人都爱丰厚加薪。然而假如你得知一位同事加薪比你更丰厚，那你的快乐可能会骤然消失。事实上,如果他还有懒散的名声，那你甚至可能会变得震怒。这样的行为被认为是“人之常情”，其潜在假设是其他动物不具有这种高度发达的委屈意识。但由佐治亚州亚特兰大市埃默里大学的萨拉·布鲁斯南和弗兰斯·德·瓦尔完成的一项刚刚发表于《自然》上的研究表明，这也是“猴之常情”。",
    sentences: [
    { num: "①", en: "Everybody loves a fat pay rise.", ref: "人人都爱丰厚加薪。",
      ai: { backbone: "主语 Everybody、谓语 loves、宾语 a fat pay rise", structure: ["形容词短语 a fat：作定语，修饰宾语 pay rise，用于说明加薪的额度特征，意为“丰厚的”"], collocations: ["fat pay rise（丰厚加薪）"] }},
    { num: "②", en: "Yet pleasure at your own can vanish if you learn that a colleague has been given a bigger one.", ref: "然而假如你得知一位同事加薪比你更丰厚，那你的快乐可能会骤然消失。",
      ai: { backbone: "主语 pleasure at your own（你自身的喜悦）、谓语 can vanish（可能会消失），整体为主谓结构，后接条件状语从句。", structure: ["条件状语从句：if you learn that a colleague has been given a bigger one，修饰主句，说明主句中“快乐消失”的触发条件。","宾语从句：that a colleague has been given a bigger one，作learn的宾语，补充说明“得知”的具体内容，其中bigger one指代前文提及的加薪。"], collocations: ["pleasure at（对……的喜悦）","vanish（消失，常指突然消失）","learn that（得知……，后接宾语从句）"] }},
    { num: "③", en: "Indeed, if he has a reputation for slacking, you might even be outraged.", ref: "事实上,如果他还有懒散的名声，那你甚至可能会变得震怒。",
      ai: { backbone: "主语 you、谓语 might be outraged；条件状语从句中，主语 he、谓语 has、宾语 a reputation", structure: ["条件状语从句：由 if 引导，修饰主句谓语 might be outraged，说明产生“震怒”情绪的条件","介词短语作后置定语：for slacking 修饰 reputation，说明名声的具体内容是“懒散”"], collocations: ["have a reputation for（有……的名声）"] }},
    { num: "④", en: "Such behaviour is regarded as “all too human”, with the underlying assumption that other animals would not be capable of this finely developed sense of grievance.", ref: "这样的行为被认为是“人之常情”，其潜在假设是其他动物不具有这种高度发达的委屈意识。",
      ai: { backbone: "主语 Such behaviour、谓语 is regarded as、表语 “all too human”", structure: ["介词短语作伴随状语：with the underlying assumption，修饰主句，引出后续的补充说明内容","同位语从句：that other animals would not be capable of this finely developed sense of grievance，修饰 assumption，具体解释“潜在假设”的具体内容"], collocations: ["be regarded as（被认为是，被视作）","underlying assumption（潜在假设，隐含前提）","be capable of（具有……的能力，能够）","sense of grievance（委屈感，不满意识）"] }},
    { num: "⑤", en: "But a study by Sarah Brosnan and Frans de Waal of Emory University in Atlanta, Georgia, which has just been published in Nature, suggests that it is all too monkey, as well.", ref: "但由佐治亚州亚特兰大市埃默里大学的萨拉·布鲁斯南和弗兰斯·德·瓦尔完成的一项刚刚发表于《自然》上的研究表明，这也是“猴之常情”。",
      ai: { backbone: "主语是 a study（一项研究），谓语是 suggests（表明），宾语是由that引导的宾语从句（it is all too monkey, as well）。", structure: ["介词短语作后置定语：by Sarah Brosnan and Frans de Waal of Emory University in Atlanta, Georgia，修饰主语a study，说明研究的执行者及所属机构，明确研究的来源主体","非限制性定语从句：which has just been published in Nature，修饰先行词a study，补充说明研究的发表情况，丰富主语的附加信息","宾语从句：that it is all too monkey, as well，作谓语动词suggests的宾语，完整呈现研究得出的核心结论，是句子的核心内容载体"], collocations: ["be published in（发表于……，指研究成果在刊物上刊载，考研常考的学术场景搭配）","all too（太……、过于……，强调程度之深，考研阅读中常用于表达带有感慨的语气，此处引申为“常态、常情”）"] }}
    ]
  },
  {
    day: 2,
    type: "英一",
    source: "2005 Text 1",
    zh: "研究者们研究了雌性棕色卷尾猴的习性。这些猴子看起来很可爱。它们是生性温和，乐于合作的动物，且愿意分享食物。最重要的是,像人类女性一样,它们往往比雄性更注重“物品与服务”的价值。",
    sentences: [
    { num: "①", en: "The researchers studied the behaviour of female brown capuchin monkeys.", ref: "研究者们研究了雌性棕色卷尾猴的习性。",
      ai: { backbone: "主语 The researchers、谓语 studied、宾语 the behaviour", structure: ["后置定语 of female brown capuchin monkeys：修饰宾语 the behaviour，限定行为的主体是雌性棕色卷尾猴，使宾语范围更具体。"], collocations: ["study the behaviour（研究行为）","brown capuchin monkeys（棕色卷尾猴）"] }},
    { num: "②", en: "They look cute.", ref: "这些猴子看起来很可爱。",
      ai: { backbone: "主语 They（指代猴子）、系动词 look、表语 cute", structure: ["无其他修饰成分，该句为简单句，主系表结构完整，无需额外修饰即可表达完整语义。"], collocations: ["look cute（看起来很可爱）"] }},
    { num: "③", en: "They are good-natured, co-operative creatures, and they share their food readily.", ref: "它们是生性温和，乐于合作的动物，且愿意分享食物。",
      ai: { backbone: "主语They、系动词are、表语good-natured, co-operative creatures；并列连词and连接第二个主谓结构，主语They、谓语share、宾语their food", structure: ["并列主系表结构：good-natured, co-operative为并列形容词作定语，修饰表语creatures，说明主语They的特征","并列谓宾结构：状语readily修饰谓语动词share，说明分享食物的方式，补充动作的状态"], collocations: ["good-natured（生性温和的）","co-operative（乐于合作的）","share sth.（分享某物）","readily（乐意地、主动地）"] }},
    { num: "④", en: "Above all, like their female human counterparts, they tend to pay much closer attention to the value of “goods and services” than males.", ref: "最重要的是,像人类女性一样,它们往往比雄性更注重“物品与服务”的价值。",
      ai: { backbone: "主语：they；谓语：tend to pay；宾语：much closer attention；状语：Above all（程度状语）、like their female human counterparts（方式状语）、to the value of 'goods and services'（对象状语）、than males（比较状语）。", structure: ["Above all：程度状语，修饰整个句子，突出强调核心程度，意为‘最重要的是’","like their female human counterparts：介词短语作方式状语，修饰谓语tend to pay，说明比较的方式，意为‘像人类女性一样’","to the value of 'goods and services'：介词短语作对象状语，修饰谓语pay attention，明确关注的具体对象，意为‘对‘商品与服务’的价值’","than males：比较状语，修饰谓语中的核心短语pay much closer attention，构成比较关系，意为‘比雄性’"], collocations: ["Above all（最重要的是，表强调程度的常用短语）","pay attention to（关注，考研高频固定搭配）","goods and services（商品与服务，常用经济类固定搭配）"] }}
    ]
  },
  {
    day: 3,
    type: "英一",
    source: "2005 Text 1",
    zh: "这些特征使它们成为布鲁斯南博士和德·瓦尔博士研究的理想对象。研究人员花费了两年的时间教猴子用代币换取食物。通常情况下，猴子很乐意用石块换取黄瓜片。然而，当两只猴子被安置在隔开但相邻的房间里，以便它们能够看到彼此用石块换取的东西时，它们的行为就会变得明显不同了。",
    sentences: [
    { num: "①", en: "Such characteristics make them perfect candidates for Dr. Brosnan’s and Dr. de Waal’s study.", ref: "这些特征使它们成为布鲁斯南博士和德·瓦尔博士研究的理想对象。",
      ai: { backbone: "主语 Such characteristics、谓语 make、宾语 them、宾语补足语 perfect candidates", structure: ["介词短语 for Dr. Brosnan’s and Dr. de Waal’s study：作后置定语，修饰宾语补足语 perfect candidates，说明成为理想对象的所属研究领域"], collocations: ["make sb. sth.（使某人成为某事，此处指使它们成为理想对象）","perfect candidates（理想对象/完美候选人，此处指符合研究要求的合适对象）"] }},
    { num: "②", en: "The researchers spent two years teaching their monkeys to exchange tokens for food.", ref: "研究人员花费了两年的时间教猴子用代币换取食物。",
      ai: { backbone: "主语 The researchers、谓语 spent、宾语 two years", structure: ["非谓语结构（teaching their monkeys to exchange tokens for food）：作宾语补足语，补充说明谓语动词 spent 的具体内容，即“花费两年时间所做的动作”，其中包含宾语 their monkeys 和不定式宾语补足语 to exchange tokens for food，进一步明确教猴子的具体内容。","不定式短语（to exchange tokens for food）：作宾语补足语，修饰 teaching，补充说明教猴子的具体行为，即“教猴子做什么”。"], collocations: ["spend time (in) doing sth.（花费时间做某事）","exchange...for...（用……换取……）"] }},
    { num: "③", en: "Normally, the monkeys were happy enough to exchange pieces of rock for slices of cucumber.", ref: "通常情况下，猴子很乐意用石块换取黄瓜片。",
      ai: { backbone: "主语 the monkeys，谓语 were，表语 happy，构成主系表结构，核心表达猴子的状态。", structure: ["Normally（副词作状语）：修饰整个句子，说明动作发生的频率，意为“通常情况下”。","to exchange pieces of rock for slices of cucumber（不定式短语作原因状语）：修饰表语happy，解释猴子“开心乐意”的具体原因，即“用石块换取黄瓜片”。"], collocations: ["be happy to do sth.（乐意做某事）","exchange A for B（用A换取B）"] }},
    { num: "④", en: "However, when two monkeys were placed in separate but adjoining chambers, so that each could observe what the other was getting in return for its rock, their behaviour became markedly different.", ref: "然而，当两只猴子被安置在隔开但相邻的房间里，以便它们能够看到彼此用石块换取的东西时，它们的行为就会变得明显不同了。",
      ai: { backbone: "主语 their behaviour、谓语 became、表语 markedly different", structure: ["让步状语从句：when two monkeys were placed in separate but adjoining chambers，修饰主句，说明行为发生变化的时间背景，从句主语为two monkeys，谓语为were placed，in separate but adjoining chambers为介词短语作地点状语","目的状语从句：so that each could observe what the other was getting in return for its rock，修饰前面的时间状语从句，说明猴子被安置的目的，从句主语为each，谓语为could observe，宾语为what引导的宾语从句what the other was getting in return for its rock，该宾语从句中主语为the other，谓语为was getting，in return for its rock为介词短语作状语，说明换取的回报"], collocations: ["in separate but adjoining chambers（被安置在隔开但相邻的房间里）","in return for（作为……的回报）","markedly different（明显不同）"] }}
    ],
    analysis: [
      {
        sentNum: "④",
        vocab: [
      { raw: "separateadj.分开的", word: "separate", meaning: "adj.分开的" },
      { raw: "adjoiningadj.邻接的", word: "adjoining", meaning: "adj.邻接的" },
      { raw: "chambern.房间，室", word: "chamber", meaning: "n.房间，室" },
      { raw: "observev.观察", word: "observe", meaning: "v.观察" },
      { raw: "markedlyadv.显著地", word: "markedly", meaning: "adv.显著地" },
      { raw: "rockn.岩石", word: "rock", meaning: "n.岩石" },
      { raw: "inreturnfor作为...的回报", word: "inreturnfor", meaning: "作为...的回报" }
    ],
        split: "However,whentwomonkeyswereplaced//inseparatebutadjoiningchambers, //sothateachcouldobserve//whattheotherwasgetting//inreturnforitsrock, //theirbehaviourbecamemarkedlydifferent.",
        grammar: ["主干：主+系+表", "主干提炼：theirbehaviourbecamedifferent.", "when引导状语从句", "sothat引导状语从句", "what引导宾语从句", "inreturnfor作为...的回报"],
        ref: "然而，当两只猴子被安置在隔开但相邻的房间里，以便它们能够看到彼此用石块换取的东西时，它们的行为就会变得明显不同了。"
      }
    ]
  },
  {
    day: 4,
    type: "英一",
    source: "2005 Text 1",
    zh: "在卷尾猴的世界里，葡萄是奢侈品（且比黄瓜要受欢迎得多）。所以当一只猴子用一个代币换到一颗葡萄时，第二只猴子就不愿意用自己的代币只换取一片黄瓜了。 如果一只猴子根本无需用代币作为交换就得到一颗葡萄，那么另一只猴子就会把代币砸向研究人员或者扔出房间外，或者拒绝接受那片黄瓜。事实上，只要在另一个房间出现了葡萄（根本没有猴子吃它），就足以引起雌性卷尾猴的愤恨了。",
    sentences: [
    { num: "①", en: "In the world of capuchins grapes are luxury goods (and much preferable to cucumbers).", ref: "在卷尾猴的世界里，葡萄是奢侈品（且比黄瓜要受欢迎得多）。",
      ai: { backbone: "主语是 grapes（葡萄），谓语是 are，表语是 luxury goods（奢侈品），状语是 In the world of capuchins（在卷尾猴的世界里）。", structure: ["介词短语作状语：In the world of capuchins，修饰整个句子，表明事件发生的背景范围，即‘在卷尾猴的世界里’。","括号内并列句作补充说明：(and much preferable to cucumbers)，用并列连词 and 连接，对前文的 luxury goods 进行补充，说明葡萄相较于黄瓜更受青睐，起到补充解释的作用。"], collocations: ["preferable to（比……更受欢迎、更受青睐）"] }},
    { num: "②", en: "So when one monkey was handed a grape in exchange for her token, the second was reluctant to hand hers over for a mere piece of cucumber.", ref: "所以当一只猴子用一个代币换到一颗葡萄时，第二只猴子就不愿意用自己的代币只换取一片黄瓜了。",
      ai: { backbone: "主干为复合句，主句是“the second was reluctant to hand hers over for a mere piece of cucumber”（主语the second，系动词was，表语reluctant，不定式短语to hand hers over for a mere piece of cucumber作表语补足语）；从句是“when one monkey was handed a grape in exchange for her token”（时间状语从句，从句主语one monkey，谓语was handed，宾语a grape，状语in exchange for her token）。", structure: ["时间状语从句：when引导，修饰主句，说明主句动作发生的时间背景，从句中“in exchange for her token”是介词短语作状语，修饰从句谓语“was handed”，表示交换的方式。","主句表语补足语：不定式短语“to hand hers over for a mere piece of cucumber”，修饰表语“reluctant”，说明“不情愿”的具体行为，其中“for a mere piece of cucumber”是介词短语作状语，修饰不定式短语中的动词“hand over”，表示交换的代价。"], collocations: ["in exchange for（作为……的交换）","be reluctant to do sth.（不情愿做某事）","hand over（交出，移交）"] }},
    { num: "③", en: "And if one received a grape without having to provide her token in exchange at all, the other either tossed her own token at the researcher or out of the chamber, or refused to accept the slice of cucumber.", ref: "如果一只猴子根本无需用代币作为交换就得到一颗葡萄，那么另一只猴子就会把代币砸向研究人员或者扔出房间外，或者拒绝接受那片黄瓜。",
      ai: { backbone: "主语为并列的 the other（另一只猴子），谓语为 either tossed...or out of..., or refused...，其中 tossed 的宾语为 her own token，refused 的宾语为 to accept the slice of cucumber。", structure: ["条件状语从句：if one received a grape without having to provide her token in exchange at all，修饰主句，表明主句动作发生的前提条件","方式状语：without having to provide her token in exchange at all，修饰从句谓语 received，说明得到葡萄无需提供代币交换的方式","并列谓语结构：either tossed her own token at the researcher or out of the chamber, or refused to accept the slice of cucumber，以 either...or...结构连接两个并列谓语，明确另一只猴子的两种行为"], collocations: ["provide...in exchange（用……作为交换）","either...or...（要么……要么……；或者……或者……）","refuse to accept（拒绝接受）"] }},
    { num: "④", en: "Indeed, the mere presence of a grape in the other chamber (without an actual monkey to eat it) was enough to induce resentment in a female capuchin.", ref: "事实上，只要在另一个房间出现了葡萄（根本没有猴子吃它），就足以引起雌性卷尾猴的愤恨了。",
      ai: { backbone: "主语：the mere presence of a grape in the other chamber（另一个房间里单单有一颗葡萄）；谓语：was enough（就足以）；宾语：to induce resentment in a female capuchin（引发雌性卷尾猴的怨恨）。", structure: ["插入语：(without an actual monkey to eat it)，对主语中“葡萄存在”的情境进行补充说明，排除有猴子吃葡萄的情况，使语义更完整。","不定式短语作结果状语：to induce resentment in a female capuchin，修饰谓语“was enough”，说明“足以”达成的具体结果，即引发怨恨。"], collocations: ["mere presence（仅仅存在，单单出现）","be enough to do（足以做某事，足够做某事）","induce resentment（引发怨恨，激起愤恨）"] }}
    ]
  },
  {
    day: 5,
    type: "英一",
    source: "2005 Text 1",
    zh: "研究人员指出，正如人类一样，卷尾猴也受到社会情感的支配。在野外，它们是协作、群居的物种。只有当每只猴子都感到自己没有遭受不公时，这种协作才可能稳定。义愤感似乎不只是人类的专利。拒绝一份较少的酬劳可以完全将这些情绪十分明确地传达给组内其他成员。但是这种公平感是从卷尾猴和人类身上各自演化而来，还是来源于三千五百万年以前他们共同的祖先，至今仍是个有待回答的问题。",
    sentences: [
    { num: "①", en: "The researchers suggest that capuchin monkeys, like humans, are guided by social emotions.", ref: "研究人员指出，正如人类一样，卷尾猴也受到社会情感的支配。",
      ai: { backbone: "主语 The researchers、谓语 suggest、宾语从句（that 引导）that capuchin monkeys are guided by social emotions", structure: ["同位语/插入语：like humans，插入在主语 capuchin monkeys 后，补充说明卷尾猴和人类的相似性，起补充修饰作用","宾语从句：that capuchin monkeys are guided by social emotions，作谓语动词 suggest 的宾语，完整表达研究人员提出的核心观点"], collocations: ["suggest that...（提出……；表明……，后接宾语从句，用于引出观点或结论）","be guided by（受到……的引导/支配，强调被某种力量或因素引导）"] }},
    { num: "②", en: "In the wild, they are a co-operative, group-living species.", ref: "在野外，它们是协作、群居的物种。",
      ai: { backbone: "主语 they、系动词 are、表语 a co-operative, group-living species（主系表结构）", structure: ["状语 In the wild：介词短语作地点状语，修饰整个句子，说明这种属性的适用环境","并列定语 co-operative、group-living：两个形容词共同修饰表语 species，说明物种的习性与特征"], collocations: ["in the wild（在野外）","group-living species（群居物种）","co-operative（协作的）"] }},
    { num: "③", en: "Such co-operation is likely to be stable only when each animal feels it is not being cheated.", ref: "只有当每只猴子都感到自己没有遭受不公时，这种协作才可能稳定。",
      ai: { backbone: "主语 Such co-operation、系动词 is、表语 likely to be stable", structure: ["条件状语从句：由'when'引导，修饰主句的谓语部分，说明'这种合作可能稳定'的唯一条件。","宾语从句：'it is not being cheated'作'feels'的宾语，从句中'it'指代前文的'each animal'，说明动物所感知的具体内容。"], collocations: ["be likely to（有可能）","be stable（保持稳定）","feel + 宾语从句（感到……）"] }},
    { num: "④", en: "Feelings of righteous indignation, it seems, are not the preserve of people alone.", ref: "义愤感似乎不只是人类的专利。",
      ai: { backbone: "主语是 Feelings of righteous indignation（义愤感），谓语是 are（是），表语是 not the preserve of people alone（不只是人类的专利）。", structure: ["插入语成分：it seems，插入在主语和谓语之间，用于表达说话人对句子内容的判断语气，意为“似乎”，起到缓和语气、补充说明的作用","介词短语作后置定语：of righteous indignation，修饰主语核心词 Feelings，明确“义愤感”的具体情感属性，限定主语的语义范围","介词短语作表语后置修饰成分：of people alone，修饰表语核心词 preserve，说明“专利”的归属对象，强调“仅属于人类”这一限定含义"], collocations: ["feelings of...（……的感觉/情绪）","righteous indignation（义愤）","not...alone（不只是……）","the preserve of...（……的专属/专利）"] }},
    { num: "⑤", en: "Refusing a lesser reward completely makes these feelings abundantly clear to other members of the group.", ref: "拒绝一份较少的酬劳可以完全将这些情绪十分明确地传达给组内其他成员。",
      ai: { backbone: "主语是动名词短语Refusing a lesser reward（拒绝一份较少的酬劳），谓语是makes，宾语是these feelings（这些情绪），宾语补足语是abundantly clear（十分清晰地）", structure: ["动名词短语作主语：Refusing a lesser reward，整体充当句子主语，表达“拒绝一份较少的酬劳”这一行为，是动作的发出者","程度副词作状语：completely，修饰谓语动词makes，强调动作的程度，意为“完全地”","副词作宾语补足语的修饰成分：abundantly，修饰宾语补足语clear，补充说明清晰的程度，意为“十分地、充分地”","介词短语作对象状语：to other members of the group，修饰谓语动词makes，明确动作的对象，意为“给群体中的其他成员”"], collocations: ["refuse a reward（拒绝一份酬劳）","make sth. clear to sb.（让某事对某人来说十分清晰，向某人明确展现某事）"] }},
    { num: "⑥", en: "However, whether such a sense of fairness evolved independently in capuchins and humans, or whether it stems from the common ancestor that the species had 35 million years ago, is, as yet, an unanswered question.", ref: "但是这种公平感是从卷尾猴和人类身上各自演化而来，还是来源于三千五百万年以前他们共同的祖先，至今仍是个有待回答的问题。",
      ai: { backbone: "主语为并列主语从句‘whether such a sense of fairness evolved independently in capuchins and humans, or whether it stems from the common ancestor that the species had 35 million years ago’，谓语是系动词‘is’，表语是‘an unanswered question’。", structure: ["并列主语从句1：whether such a sense of fairness evolved independently in capuchins and humans，修饰主语，说明第一种可能的演化情况，即公平感在卷尾猴和人类身上独立演化","并列主语从句2：or whether it stems from the common ancestor that the species had 35 million years ago，与第一个主语从句并列，共同作主语，说明第二种可能的来源，即公平感源于共同祖先，其中包含定语从句that the species had 35 million years ago，修饰先行词the common ancestor，明确共同祖先的时间属性","插入语：as yet，位于系动词is后，修饰整个句子，表时间状态，意为‘到目前为止’","表语：an unanswered question，承接系动词is，说明主语所指代的两种情况共同构成的核心结论，即尚未有答案的问题"], collocations: ["sense of fairness（公平感）","evolve independently（独立演化）","stem from（源于；来自）","common ancestor（共同祖先）","as yet（到目前为止；至今）"] }}
    ],
    analysis: [
      {
        sentNum: "⑥",
        vocab: [
      { raw: "evolvev.进化，演化", word: "evolve", meaning: "v.进化，演化" },
      { raw: "capuchinsn.卷尾猴", word: "capuchins", meaning: "n.卷尾猴" },
      { raw: "ancestorn.祖先", word: "ancestor", meaning: "n.祖先" }
    ],
        split: "However,whethersuchasenseoffairnessevolvedindependently//incapuchins andhumans,//orwhetheritstemsfromthecommonancestor//(thatthespecieshad 35millionyearsago,)is,//asyet,//anunansweredquestion.",
        grammar: ["主干：主+系+表（主从+系+表）", "结构提炼：whetherAorwhetherBisanunansweredquestion.", "whether引导主语从句", "or并列两个主语从句", "that引导定语从句（限定ancestor）"],
        ref: "但是这种公平感是从卷尾猴和人类身上各自演化而来，还是来源于3500万年以前他们共同的祖先，至今仍是个有待回答的问题（未解之谜）。"
      }
    ]
  },
  {
    day: 6,
    type: "英一",
    source: "2005 Text 2",
    zh: "还记得那些年吗？科学家们提出吸烟会使我们丧命，而怀疑者们却坚称我们对此无法定论？他们坚称证据不确凿，科学不确定；他们坚称反对吸烟的游说者企图破坏我们的生活方式，而政府应该置身事外。许多美国人听信了那些谬论，结果过去三十年间，大约一千万烟民过早地进了坟墓。",
    sentences: [
    { num: "①", en: "Do you remember all those years when scientists argued that smoking would kill us but the doubters insisted that we didn’t know for sure?", ref: "还记得那些年吗？科学家们提出吸烟会使我们丧命，而怀疑者们却坚称我们对此无法定论？",
      ai: { backbone: "主语为You，谓语为remember，宾语为all those years（Do you remember all those years?构成主谓宾结构，为主干句）", structure: ["成分解析1：when引导定语从句，修饰先行词all those years，在从句中作时间状语，补充说明“那些年”里发生的具体情况","成分解析2：that引导宾语从句（smoking would kill us），作argued的宾语，说明科学家所主张的核心内容","成分解析3：that引导宾语从句（we didn’t know for sure），作insisted的宾语，说明怀疑者所坚持的核心观点","成分解析4：but为并列连词，连接两个并列分句（scientists argued...和the doubters insisted...），表转折关系，衔接科学家与怀疑者的不同立场"], collocations: ["argue that（认为；主张，常接宾语从句表达观点）","insist that（坚持认为；坚称，常接宾语从句强调立场）","for sure（确定地；无疑地，常作状语修饰动词或整个句子）"] }},
    { num: "②", en: "That the evidence was inconclusive, the science uncertain? That the antismoking lobby was out to destroy our way of life and the government should stay out of the way?", ref: "他们坚称证据不确凿，科学不确定；他们坚称反对吸烟的游说者企图破坏我们的生活方式，而政府应该置身事外。",
      ai: { backbone: "主语they + 谓语claimed + 宾语从句（证据不确凿，科学不确定）+ 并列宾语从句（反对吸烟的游说者企图破坏我们的生活方式，而政府应该置身事外）", structure: ["成分解析1：that引导的第一个宾语从句，修饰动词claimed，说明他们坚称的内容"], collocations: ["antismoking lobby（反对吸烟的游说者）","out to destroy our way of life（企图破坏我们的生活方式）"] }},
    { num: "③", en: "Lots of Americans bought that nonsense, and over three decades, some 10 million smokers went to early graves.", ref: "许多美国人听信了那些谬论，结果过去三十年间，大约一千万烟民过早地进了坟墓。",
      ai: { backbone: "主语 Lots of Americans、谓语 bought、宾语 that nonsense；并列句后句主语 some 10 million smokers、谓语 went to、宾语 early graves。", structure: ["并列连词 and：连接两个独立分句，构成并列关系，前句表原因，后句表结果，使两句逻辑衔接自然","状语 over three decades：时间状语，修饰后句谓语 went to，明确动作发生的时间跨度","状语结果词 over：在此处表结果，承接前句“听信谬论”带来的后果，衔接前后句的因果逻辑"], collocations: ["buy nonsense（听信谬论）","go to early graves（过早离世/过早进坟墓）"] }}
    ]
  },
  {
    day: 7,
    type: "英一",
    source: "2005 Text 2",
    zh: "如今，在科学家们前赴后继努力唤醒我们关注全球变暖这一与日俱增的威胁之时令人不安的类似情形再次出现。最新一轮（的科学家努力）是，受白宫邀请成立的国家科学院专家小组告诉我们，地球气候毫无疑问正在变暖，而且这一问题主要是人为造成的。（他们传达的）明确信息是我们应该立刻着手保护自己。国家科学院院长布鲁斯·阿尔伯特在专家小组报告的前言中加上了这一重要观点：“科学从来都不能解答所有问题。但科学确实为我们提供了关于未来的最好的可行性指导，我们国家和整个世界在做重要决策时，应该以科学能够提供的关于人类当前行为对未来影响的最佳判断为依据，这一点至关重要。”",
    sentences: [
    { num: "①", en: "There are upsetting parallels today, as scientists in one wave after another try to awaken us to the growing threat of global warming.", ref: "如今，在科学家们前赴后继努力唤醒我们关注全球变暖这一与日俱增的威胁之时令人不安的类似情形再次出现。",
      ai: { backbone: "主干为there be句型：存在（谓语）令人不安的类似情形（主语），核心结构为“There are upsetting parallels”，表示“存在令人不安的类似情形”。", structure: ["状语成分：today，作时间状语，修饰整个主句，表明事件发生的时间背景","定语从句：as scientists in one wave after another try to awaken us to the growing threat of global warming，as引导定语从句，修饰先行词parallels，说明“令人不安的类似情形”产生的伴随情境","介词短语：in one wave after another，作方式状语，修饰从句谓语动词try，说明科学家行动的方式，意为“一波接一波地”","非谓语结构：to awaken us to the growing threat of global warming，不定式短语作目的状语，修饰从句谓语动词try，表明科学家努力的目的"], collocations: ["upsetting parallels（令人不安的类似情形）","in one wave after another（一波接一波地）","awaken sb to sth（唤醒某人关注某事）","global warming（全球变暖）"] }},
    { num: "②", en: "The latest was a panel from the National Academy of Sciences, enlisted by the White House, to tell us that the Earth’s atmosphere is definitely warming and that the problem is largely man-made.", ref: "最新一轮（的科学家努力）是，受白宫邀请成立的国家科学院专家小组告诉我们，地球气候毫无疑问正在变暖，而且这一问题主要是人为造成的。",
      ai: { backbone: "主语 The latest、系动词 was、表语 a panel from the National Academy of Sciences", structure: ["过去分词短语作后置定语：enlisted by the White House，修饰表语 a panel，说明专家小组的来源与委托关系，即“被白宫委托的”。","不定式短语作目的状语：to tell us，修饰主干谓语系动词 was，表明专家小组的存在目的，即“为了告知我们”。","并列宾语从句：that the Earth’s atmosphere is definitely warming and that the problem is largely man-made，作动词 tell 的直接宾语，明确告知的具体内容，两个 that 从句并列，分别说明大气变暖的事实和问题的成因。"], collocations: ["National Academy of Sciences（国家科学院）","be enlisted by（被……委托/委派）","definitely warming（无疑正在变暖）","largely man-made（在很大程度上是人为造成的）"] }},
    { num: "③", en: "The clear message is that we should get moving to protect ourselves.", ref: "（他们传达的）明确信息是我们应该立刻着手保护自己。",
      ai: { backbone: "主语 The clear message、系动词 is、表语从句 that we should get moving to protect ourselves", structure: ["表语从句：that we should get moving to protect ourselves，作系动词 is 的表语，说明主语‘明确信息’的具体内容","目的状语：to protect ourselves，修饰表语从句中的谓语 get moving，表明行动的目的"], collocations: ["clear message（明确的信息）","get moving（立刻行动；着手行动）"] }},
    { num: "④", en: "The president of the National Academy, Bruce Alberts, added this key point in the preface to the panel’s report: “Science never has all the answers.", ref: "国家科学院院长布鲁斯·阿尔伯特在专家小组报告的前言中加上了这一重要观点：“科学从来都不能解答所有问题。",
      ai: { backbone: "主语：The president of the National Academy, Bruce Alberts（国家科学院院长布鲁斯·阿尔伯特）；谓语：added（加上了）；宾语：this key point（这一重要观点）；状语：in the preface to the panel's report（在专家小组报告的前言中）", structure: ["同位语：Bruce Alberts，补充说明主语The president of the National Academy的具体所指，明确人物身份","介词短语作状语：in the preface to the panel's report，修饰谓语动词added，说明动作发生的地点范围，即“在专家小组报告的前言中”"], collocations: ["president of...（……的院长/主席）：表示机构负责人，此处指国家科学院院长","add...point（加上……观点）：表示补充、添加某一观点，此处指加上重要观点","preface to...（……的前言）：表示某份文件的前言部分，此处指专家小组报告的前言"] }},
    { num: "⑤", en: "But science does provide us with the best available guide to the future, and it is critical that our nation and the world base important policies on the best judgments that science can provide concerning the future consequences of present actions.”", ref: "但科学确实为我们提供了关于未来的最好的可行性指导，我们国家和整个世界在做重要决策时，应该以科学能够提供的关于人类当前行为对未来影响的最佳判断为依据，这一点至关重要。”",
      ai: { backbone: "主语 science、谓语 does provide、间接宾语 us、直接宾语 the best available guide；并列句主语 it、系动词 is、表语 critical", structure: ["并列连词 and 连接的两个并列分句：第一个分句为主谓双宾结构，第二个分句为 it 作形式主语、that 引导的主语从句作真正主语的结构","介词短语 to the future：作后置定语，修饰 guide，说明指导的指向","主语从句 that our nation and the world base important policies on the best judgments：作第二个分句的真正主语，其中 base...on...为谓语结构，our nation and the world 为主语，important policies 为宾语，the best judgments 为介词 on 的宾语","定语从句 that science can provide：修饰 judgments，限定判断的来源","现在分词短语 concerning the future consequences of present actions：作后置定语，修饰 judgments，说明判断所针对的具体内容"], collocations: ["provide sb. with sth.（为某人提供某物）","base...on...（以……为依据）","be critical that...（……至关重要）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "criticaladj.重要的，关键的", word: "critical", meaning: "adj.重要的，关键的" }
    ],
        split: "Butsciencedoesprovideus//withthebestavailableguide//tothefuture,//anditis critical//thatournationandtheworldbaseimportantpoliciesonthebestjudgments //(thatsciencecanprovide)//(concerningthefutureconsequences//ofpresent actions.)",
        grammar: ["主干1:主+谓+宾+宾", "主干2:主+系+表", "结构提炼：itiscriticalthatsb.(should)baseAonB", "baseAonB基于B做A", "and并列两个分句", "that引导主语从句（形式主语句式）", "that引导定语从句（限定judgments）", "concerning...现在分词结构/介词短语作后置定语（限定judgments）"],
        ref: "科学从来都不能解答所有问题。但科学确实为我们提供了关于未来的最好的可行性指导，我们国家和整个世界在做重要决策时，应该以(科学能够提供的)(关于人类当前行为对未来影响的)最佳判断为依据，这一点至关重要。"
      }
    ]
  },
  {
    day: 8,
    type: "英一",
    source: "2005 Text 2",
    zh: "就像在吸烟问题上一样，现在来自多方面的声音坚持认为有关全球变暖的科学研究还不完善，在我们证实这件事之前可以继续向大气中排放废气。这是一个危险的游戏：到证据百分之百确凿的时候，可能就太晚了。随着风险日益明显并加剧，明智谨慎的民族现在就应该采取防范措施了。",
    sentences: [
    { num: "①", en: "Just as on smoking, voices now come from many quarters insisting that the science about global warming is incomplete, that it’s OK to keep pouring fumes into the air until we know for sure.", ref: "就像在吸烟问题上一样，现在来自多方面的声音坚持认为有关全球变暖的科学研究还不完善，在我们证实这件事之前可以继续向大气中排放废气。",
      ai: { backbone: "主语：voices（声音）；谓语：come（出现）、insisting（坚持认为）；宾语：that the science about global warming is incomplete、that it’s OK to keep pouring fumes into the air until we know for sure（两个that引导的宾语从句，作insisting的宾语）。", structure: ["成分解析1：Just as on smoking（方式状语），修饰整个主句，说明后续情况与“吸烟问题上的情况”类似。","成分解析2：now（时间状语），修饰谓语come，表明声音出现的时间。","成分解析3：from many quarters（介词短语作后置定语），修饰主语voices，说明声音的来源。","成分解析4：insisting that...（现在分词短语作后置定语），修饰主语voices，说明声音所表达的核心内容，后接两个that引导的宾语从句补充说明insisting的具体内容。","成分解析5：that the science about global warming is incomplete（同位语从句，与insisting后的that并列），具体说明insisting的第一个观点，即“全球变暖的科学研究不完善”。","成分解析6：that it’s OK to keep pouring fumes into the air until we know for sure（同位语从句，与第一个that并列），具体说明insisting的第二个观点，即“在确切知晓前继续排放废气是可行的”，其中to keep pouring fumes into the air（不定式短语）作真正主语，until we know for sure（时间状语从句）修饰“排放废气”的时间条件。"], collocations: ["come from（来自）","many quarters（各方；多个领域）","insist that（坚持认为）","science about（关于……的科学研究）","keep doing sth（持续做某事）","pour...into...（向……排放/倾倒……）","for sure（确切地；肯定地）"] }},
    { num: "②", en: "This is a dangerous game: by the time 100 percent of the evidence is in, it may be too late.", ref: "这是一个危险的游戏：到证据百分之百确凿的时候，可能就太晚了。",
      ai: { backbone: "主语 This、系动词 is、表语 a dangerous game（主系表结构）", structure: ["冒号引导解释说明成分：对主干内容进行补充阐释，引出后续具体情况，说明为何这是‘危险的游戏’","时间状语从句：by the time 100 percent of the evidence is in，修饰从句主句 it may be too late，明确主句动作发生的时间节点，说明‘太晚’的前提","主句（从句中的主句）：it may be too late，是时间状语从句的核心内容，承接前文解释‘危险’的具体表现"], collocations: ["by the time（到……的时候；待到……时，用于引导时间状语从句，强调某一时间点之后的情况）","100 percent of（百分之一百的；全部的，用于修饰名词，表示数量的完全性）","be in（到位；完备，此处指证据收集齐全，是固定搭配的引申用法）"] }},
    { num: "③", en: "With the risks obvious and growing, a prudent people would take out an insurance policy now.", ref: "随着风险日益明显并加剧，明智谨慎的民族现在就应该采取防范措施了。",
      ai: { backbone: "主语：a prudent people（一个明智谨慎的民族）；谓语：would take out（会采取）；宾语：an insurance policy（一项防范措施）", structure: ["独立主格结构：With the risks obvious and growing（由with+名词+形容词构成，作伴随状语，说明动作发生的背景，即风险处于明显且加剧的状态）"], collocations: ["take out an insurance policy（采取防范措施，字面为“购买保险单”，此处引申为采取保障性措施，是考研常考的引申义搭配）","prudent people（明智谨慎的民族，prudent为考研高频形容词，意为谨慎的、审慎的）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "quartersn.团体", word: "quarters", meaning: "n.团体" },
      { raw: "fumen.烟，气", word: "fume", meaning: "n.烟，气" },
      { raw: "pourv.倾倒（poursth.into...）", word: "pour", meaning: "v.倾倒（poursth.into...）" }
    ],
        split: "Justasonsmoking,voicesnowcome//frommanyquarters//insisting//thatthe science//aboutglobalwarmingisincomplete,//thatit’sOK//tokeeppouringfumes intotheair//untilweknow//forsure.",
        grammar: ["主干:主+谓", "结构提炼：voicescomefromsb.insistingthatA,thatB", "justas...作比较状语", "insistingthat...现在分词结构作后置定语（限定quarters）", "that引导宾语从句", "until引导状语从句"],
        ref: "就像在吸烟问题上一样，现在来自多方面的声音坚持认为有关全球变暖的科学研究还不完善，在我们证实这件事之前可以继续向大气中排放废气。"
      },
      {
        sentNum: "②",
        vocab: [],
        split: "",
        grammar: ["主干：主+系+表(状语从句)", "bythetime引导状语从句表示“到...时候为止”", "inadv.进入；到达（在本句中作表语）"],
        ref: "这是一个危险的游戏，到证据百分之百确凿的时候，可能就太晚了。"
      }
    ]
  },
  {
    day: 9,
    type: "英一",
    source: "2005 Text 2",
    zh: "幸运的是，白宫开始关注此事。但很显然，大多数总统顾问仍旧没有严肃看待全球变暖这个问题。他们没有出台行动计划，相反，只是继续敦促进行更多研究——典型的分析导致“瘫痪”的案例。",
    sentences: [
    { num: "①", en: "Fortunately, the White House is starting to pay attention.", ref: "幸运的是，白宫开始关注此事。",
      ai: { backbone: "主语：the White House（白宫）；谓语：is starting（开始）；宾语：to pay attention（关注）", structure: ["插入语：Fortunately（幸运的是），独立于句子主干之外，表达说话者的态度，起到引出下文、舒缓语气的作用","不定式短语：to pay attention，作宾语，承接谓语动词is starting，说明白宫开始实施的具体动作"], collocations: ["pay attention（关注，留意）"] }},
    { num: "②", en: "But it’s obvious that a majority of the president’s advisers still don’t take global warming seriously.", ref: "但很显然，大多数总统顾问仍旧没有严肃看待全球变暖这个问题。",
      ai: { backbone: "主语 it（形式主语）、谓语 is、表语 obvious，真正的主语是that引导的主语从句（a majority of the president’s advisers为主语，don’t take为谓语，global warming为宾语，seriously为宾语补足语）", structure: ["主语从句：由that引导，作整个句子的真正主语，说明obvious的具体内容，从句中a majority of the president’s advisers作主语，don’t take作谓语，global warming作宾语，seriously作宾语补足语，补充说明对待宾语的态度","形式主语it：置于句首，替代后面的that主语从句，使句子结构平衡，避免头重脚轻"], collocations: ["take...seriously（严肃对待……，认真看待……）"] }},
    { num: "③", en: "Instead of a plan of action, they continue to press for more research—a classic case of “paralysis by analysis”.", ref: "他们没有出台行动计划，相反，只是继续敦促进行更多研究——典型的分析导致“瘫痪”的案例。",
      ai: { backbone: "主语 they、谓语 continue to press for、宾语 more research", structure: ["介词短语作状语：Instead of a plan of action，修饰整个主句，表示与主句动作形成对比的前提条件，体现“没有行动计划，反而……”的逻辑关系；","同位语：a classic case of “paralysis by analysis”，对前文“继续敦促更多研究”的行为进行补充说明，明确该行为属于“分析导致瘫痪”的典型实例，补充核心评价信息。"], collocations: ["instead of（代替；而不是）","plan of action（行动计划）","press for（敦促；强烈要求）","paralysis by analysis（分析导致瘫痪，指过度分析而无法做出决策的情况）"] }}
    ]
  },
  {
    day: 10,
    type: "英一",
    source: "2005 Text 2",
    zh: "为了担负好地球保护者的责任，我们必须加紧推进对于大气和海洋的深入研究。但仅有研究还不够。如果政府不行使立法动议权，国会应当开始帮助制定保护措施。西弗吉尼亚的民主党参议员罗伯特 · 伯德提出的一项议案——为私企提供财政奖励——就是一个很有希望的开端。许多人看到我们国家正准备修建许多新发电厂，以满足我们的能源需求。如果我们想要保护大气，那么关键是要让这些新发电厂对环境无害。",
    sentences: [
    { num: "①", en: "To serve as responsible stewards of the planet, we must press forward on deeper atmospheric and oceanic research.", ref: "为了担负好地球保护者的责任，我们必须加紧推进对于大气和海洋的深入研究。",
      ai: { backbone: "主语 we、谓语 must press forward on、宾语 deeper atmospheric and oceanic research", structure: ["成分解析1：不定式短语 To serve as responsible stewards of the planet，作目的状语，修饰主干动作，说明推进研究的目的"], collocations: ["serve as（担任；充当）","press forward on（加紧推进；持续推进）"] }},
    { num: "②", en: "But research alone is inadequate.", ref: "但仅有研究还不够。",
      ai: { backbone: "主语 research、系动词 is、表语 inadequate", structure: ["修饰成分：alone（副词作后置定语，修饰主语research，表‘仅仅、只有’，强调研究这一单一要素的局限性）","修饰成分：But（并列连词，引导转折关系，连接上下文，体现句子与前文的逻辑对立）"], collocations: ["alone（副词，单独使用，常置于名词或代词后，表‘仅仅、只有’，强调唯一性或排他性）","be inadequate（系表结构，固定搭配，表‘不够、不足、不充分’，多用于说明某事物无法满足需求或达到标准）"] }},
    { num: "③", en: "If the Administration won’t take the legislative initiative, Congress should help to begin fashioning conservation measures.", ref: "如果政府不行使立法动议权，国会应当开始帮助制定保护措施。",
      ai: { backbone: "主句主干为：Congress（主语）should help（谓语）to begin fashioning conservation measures（宾语，不定式短语作宾语）。条件状语从句为：If the Administration won’t take the legislative initiative（从句主语为the Administration，谓语为won’t take，宾语为the legislative initiative）。", structure: ["条件状语从句：If the Administration won’t take the legislative initiative，修饰主句，表明主句动作发生的前提条件，说明'国会采取行动'的触发条件是'政府不行使立法倡议权'。","不定式短语作宾语：to begin fashioning conservation measures，作动词help的宾语，其中begin后接动名词短语fashioning conservation measures作宾语，整体表达'开始着手制定保护措施'的具体动作内容，补充说明国会'帮助'的具体事项。"], collocations: ["take the legislative initiative（行使立法倡议权，指主动提出并推动立法相关工作，考研英语中常见于政策与权力类语境）","fashioning conservation measures（制定保护措施，fashion在此处意为'制定、形成'，常与措施、政策类名词搭配，为考研常考动词搭配）"] }},
    { num: "④", en: "A bill by Democratic Senator Robert Byrd of West Virginia, which would offer financial incentives for private industry, is a promising start.", ref: "西弗吉尼亚的民主党参议员罗伯特 · 伯德提出的一项议案——为私企提供财政奖励——就是一个很有希望的开端。",
      ai: { backbone: "主语：A bill by Democratic Senator Robert Byrd of West Virginia（西弗吉尼亚的民主党参议员罗伯特·伯德提出的一项议案）；谓语：is；表语：a promising start（一个很有希望的开端）", structure: ["成分解析1：介词短语by Democratic Senator Robert Byrd of West Virginia，作后置定语，修饰主语A bill，明确议案的提出者","成分解析2：非限制性定语从句which would offer financial incentives for private industry，修饰主语A bill，补充说明议案的具体内容"], collocations: ["financial incentives（财政奖励/财政激励措施）","private industry（私营企业/私企）","promising start（有希望的开端/良好的开端）"] }},
    { num: "⑤", en: "Many see that the country is getting ready to build lots of new power plants to meet our energy needs.", ref: "许多人看到我们国家正准备修建许多新发电厂，以满足我们的能源需求。",
      ai: { backbone: "主语 Many、谓语 see、宾语从句 that the country is getting ready to build lots of new power plants", structure: ["宾语从句 that the country is getting ready...：作 see 的宾语，具体说明“许多人看到”的内容","不定式短语 to build lots of new power plants：作 get ready 后的目的性补足成分，说明准备去做的事","不定式 to meet our energy needs：作目的状语，说明修建新发电厂的目的"], collocations: ["get ready to do sth（准备好做某事）","meet one's energy needs（满足能源需求）","power plants（发电厂）"] }},
    { num: "⑥", en: "If we are ever going to protect the atmosphere, it is crucial that those new plants be environmentally sound.", ref: "如果我们想要保护大气，那么关键是要让这些新发电厂对环境无害。",
      ai: { backbone: "主句：形式主语 it、系动词 is、表语 crucial，真正主语为 that 引导的主语从句；句首为 if 引导的条件状语从句", structure: ["条件状语从句 If we are ever going to protect the atmosphere：修饰主句，说明“新电厂必须无害”的前提条件","主语从句 that those new plants be environmentally sound：作句子的真正主语，谓语用虚拟式 be（it is crucial that...）"], collocations: ["protect the atmosphere（保护大气）","it is crucial that（……至关重要）","environmentally sound（对环境无害的）"] }}
    ]
  },
  {
    day: 11,
    type: "英一",
    source: "2005 Text 3",
    zh: "在一夜好眠的所有因素中，梦似乎是最无法控制的。在梦中，有一扇窗通向逻辑暂时失效、死人开口说话的世界。一个世纪前弗洛伊德创立了他的革命性理论——梦是人们无意识的欲望和恐惧所伪装的影子；到了 20 世纪 70 年代末，神经学家们转而认为梦仅仅是“精神噪音”——睡眠期间持续进行的神经修复活动的随机副产品。现在，研究者觉察到梦是大脑情绪自动调节系统的组成部分，当大脑处于“离线”状态时对情绪进行调整。一位有影响力的权威人士认为，这种异常重要的精神活动不仅能被利用，事实上还可以将其置于有意识的控制之下，以使得我们的睡眠质量更高、心情更好。芝加哥医疗中心心理部主任罗莎琳德·卡特赖特说：“这是你的梦。若不喜欢它，就改变它”",
    sentences: [
    { num: "①", en: "Of all the components of a good night’s sleep, dreams seem to be least within our control.", ref: "在一夜好眠的所有因素中，梦似乎是最无法控制的。",
      ai: { backbone: "主语 dreams、谓语 seem to be、表语 least within our control（主系表结构）", structure: ["介词短语 Of all the components of a good night's sleep：作状语，限定比较范围，说明“在所有因素中”"], collocations: ["within one's control（在某人掌控之内）","a good night's sleep（一夜好眠）"] }},
    { num: "②", en: "In dreams, a window opens into a world where logic is suspended and dead people speak.", ref: "在梦中，有一扇窗通向逻辑暂时失效、死人开口说话的世界。",
      ai: { backbone: "主语 a window、谓语 opens、介词短语 into a world 作状语表方向", structure: ["定语从句 where logic is suspended and dead people speak：修饰 a world，说明这个世界里逻辑失效、死者开口的奇幻特征"], collocations: ["open into（通向）","be suspended（被暂时中止）"] }},
    { num: "③", en: "A century ago, Freud formulated his revolutionary theory that dreams were the disguised shadows of our unconscious desires and fears; by the late 1970s, neurologists had switched to thinking of them as just “mental noise”—the random byproducts of the neural-repair work that goes on during sleep.", ref: "一个世纪前弗洛伊德创立了他的革命性理论——梦是人们无意识的欲望和恐惧所伪装的影子；到了 20 世纪 70 年代末，神经学家们转而认为梦仅仅是“精神噪音”——睡眠期间持续进行的神经修复活动的随机副产品。",
      ai: { backbone: "分号连接两个并列分句：分句1 主语 Freud、谓语 formulated、宾语 his revolutionary theory；分句2 主语 neurologists、谓语 had switched to thinking of them as just “mental noise”", structure: ["同位语从句 that dreams were the disguised shadows of our unconscious desires and fears：解释说明 theory 的具体内容","破折号后 the random byproducts of the neural-repair work：作 mental noise 的同位语，对其补充解释","定语从句 that goes on during sleep：修饰 work，说明该神经修复活动发生于睡眠期间"], collocations: ["formulate a theory（提出理论）","switch to doing sth（转而做某事）","unconscious desires（无意识欲望）"] }},
    { num: "④", en: "Now researchers suspect that dreams are part of the mind’s emotional thermostat, regulating moods while the brain is “off-line.”", ref: "现在，研究者觉察到梦是大脑情绪自动调节系统的组成部分，当大脑处于“离线”状态时对情绪进行调整。",
      ai: { backbone: "主语 researchers、谓语 suspect、宾语从句 that dreams are part of the mind's emotional thermostat", structure: ["宾语从句 that dreams are part of...：作 suspect 的宾语，说明研究者所怀疑的内容","现在分词短语 regulating moods while the brain is “off-line”：作伴随状语，修饰主干，补充说明梦的调节功能","时间状语从句 while the brain is “off-line”：修饰 regulating，说明情绪调节发生的时段"], collocations: ["emotional thermostat（情绪自动调节器）","regulate mood（调节情绪）","be off-line（处于离线状态）"] }},
    { num: "⑤", en: "And one leading authority says that these intensely powerful mental events can be not only harnessed but actually brought under conscious control, to help us sleep and feel better.", ref: "一位有影响力的权威人士认为，这种异常重要的精神活动不仅能被利用，事实上还可以将其置于有意识的控制之下，以使得我们的睡眠质量更高、心情更好。",
      ai: { backbone: "主语 one leading authority、谓语 says、宾语从句 that these intensely powerful mental events can be not only harnessed but actually brought under conscious control", structure: ["宾语从句 that these...：作 says 的宾语，转述权威人士的观点","并列结构 not only harnessed but actually brought under conscious control：not only...but 连接两个被动分词短语，说明精神活动既可利用又可受控","不定式 to help us sleep and feel better：作目的状语，说明受控后的目的"], collocations: ["not only...but（不仅……而且）","bring sth under control（把……置于控制之下）","conscious control（有意识的控制）"] }},
    { num: "⑥", en: "“It’s your dream,” says Rosalind Cartwright, chair of psychology at Chicago’s Medical Center.", ref: "芝加哥医疗中心心理部主任罗莎琳德·卡特赖特说：“这是你的梦。",
      ai: { backbone: "引语 It's your dream 作宾语前置，主语 Rosalind Cartwright、谓语 says（引述句采用倒装语序）", structure: ["同位语 chair of psychology at Chicago's Medical Center：修饰 Rosalind Cartwright，说明其身份与任职机构"], collocations: ["chair of psychology（心理学系主任）","medical center（医疗中心）"] }},
    { num: "⑦", en: "“If you don’t like it, change it.”", ref: "若不喜欢它，就改变它”",
      ai: { backbone: "主句为祈使句 change it（省略主语 you），前接 if 引导的条件状语从句", structure: ["条件状语从句 If you don't like it：修饰主句祈使句，说明“改变它”的前提条件"], collocations: ["change it（改变它）","if you don't like it（如果你不喜欢）"] }}
    ]
  },
  {
    day: 12,
    type: "英一",
    source: "2005 Text 3",
    zh: "来自大脑成像的证据证实了这个观点。匹兹堡大学的埃里克博士说，大脑在快速动眼睡眠中——大多数清晰梦境出现的时刻——和完全清醒时一样活跃。但并非大脑的所有部分都同等活跃，脑边缘系统（“情绪脑”）异常活跃，而前额皮层（思维和推理的中心地带）则相对平静。斯坦福睡眠研究员威廉 · 迪蒙特博士说：“我们从梦中醒来，无论是高兴还是沮丧这些情绪都会伴随我们一整天。”",
    sentences: [
    { num: "①", en: "Evidence from brain imaging supports this view.", ref: "来自大脑成像的证据证实了这个观点。",
      ai: { backbone: "主语 Evidence、谓语 supports、宾语 this view", structure: ["后置定语 from brain imaging：修饰主语 Evidence，说明证据的来源"], collocations: ["brain imaging（脑成像）","support a view（支持某观点）"] }},
    { num: "②", en: "The brain is as active during REM (rapid eye movement) sleep—when most vivid dreams occur—as it is when fully awake, says Dr. Eric Nofzinger at the University of Pittsburgh.", ref: "匹兹堡大学的埃里克博士说，大脑在快速动眼睡眠中——大多数清晰梦境出现的时刻——和完全清醒时一样活跃。",
      ai: { backbone: "主语 The brain、系动词 is、表语 as active，构成 as...as 比较结构；末尾 says Dr. Eric Nofzinger at the University of Pittsburgh 为引述", structure: ["比较结构 as active...as it is when fully awake：将大脑在 REM 睡眠期与完全清醒时的活跃程度进行对比","插入语 when most vivid dreams occur：解释说明 REM sleep 的特征，即最生动的梦发生之时","引述句 says Dr. Eric Nofzinger：交代观点的出处与作者"], collocations: ["rapid eye movement（快速眼动）","be fully awake（完全清醒）","most vivid dreams（最生动的梦）"] }},
    { num: "③", en: "But not all parts of the brain are equally involved; the limbic system (the “emotional brain”) is especially active, while the prefrontal cortex (the center of intellect and reasoning) is relatively quiet.", ref: "但并非大脑的所有部分都同等活跃，脑边缘系统（“情绪脑”）异常活跃，而前额皮层（思维和推理的中心地带）则相对平静。",
      ai: { backbone: "分号连接两个分句：分句1 主语 not all parts of the brain、谓语 are equally involved；分句2 主语 the limbic system、系动词 is、表语 especially active；while 引导对比分句", structure: ["插入语 the “emotional brain”：解释说明 limbic system，说明其别称与功能定位","插入语 the center of intellect and reasoning：解释说明 prefrontal cortex，说明其功能","对比状语从句 while the prefrontal cortex is relatively quiet：与前半句形成对照，说明两部分活跃程度的差异"], collocations: ["limbic system（边缘系统）","prefrontal cortex（前额叶皮层）","be equally involved（同样参与）"] }},
    { num: "④", en: "“We wake up from dreams happy or depressed, and those feelings can stay with us all day.” says Stanford sleep researcher Dr. William Dement.", ref: "斯坦福睡眠研究员威廉 · 迪蒙特博士说：“我们从梦中醒来，无论是高兴还是沮丧这些情绪都会伴随我们一整天。”",
      ai: { backbone: "引语作宾语：We wake up（主语 We、谓语 wake up）与 and those feelings can stay（并列分句）；引述 says Dr. William Dement", structure: ["形容词短语 happy or depressed：作伴随状语（主补），说明醒来时的心情状态","介词短语 all day：修饰 stay，说明情绪持续时间"], collocations: ["wake up from（从……中醒来）","stay with sb（伴随某人）","sleep researcher（睡眠研究员）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "rapidadj.迅速的", word: "rapid", meaning: "adj.迅速的" },
      { raw: "vividadj.生动的", word: "vivid", meaning: "adj.生动的" }
    ],
        split: "Thebrainisasactive//duringREM(rapideyemovement)sleep—whenmostvivid dreamsoccur—asitis//whenfullyawake,//saysDr.EricNofzinger//atthe University//ofPittsburgh.",
        grammar: ["主干:主+系+表(宾语从句)", "结构提炼：ThebrainisasactiveduringAasitiswhenB（比较结构）", "第1个when引导定语从句（限定REMsleep）", "第2个when(fullyawake)作时间状语"],
        ref: "匹兹堡大学的埃里克博士说，大脑在快速动眼睡眠中---大多数清晰梦境出现的时刻---和完全清醒时一样活跃。"
      }
    ]
  },
  {
    day: 13,
    type: "英一",
    source: "2005 Text 3",
    zh: "梦和情绪的关联在卡特赖特诊所的病人身上显露出来。大多数人似乎在晚上入睡早期做更多不好的梦，而在醒来前会逐渐做开心一些的梦，这说明人们在梦里逐渐化解白天所产生的负面情绪。因为我们有意识的大脑被日常事务占据，所以并不总能思考白天所发生的重大事件的情感意义——似乎直到开始做梦时才会。",
    sentences: [
    { num: "①", en: "The link between dreams and emotions shows up among the patients in Cartwright’s clinic.", ref: "梦和情绪的关联在卡特赖特诊所的病人身上显露出来。",
      ai: { backbone: "主语 The link、谓语 shows up、介词短语 among the patients 作状语", structure: ["后置定语 between dreams and emotions：修饰主语 The link，明确联系的双方","介词短语 among the patients in Cartwright's clinic：作地点状语，说明现象出现的范围"], collocations: ["show up（显现、显露）","the link between A and B（A 与 B 之间的联系）"] }},
    { num: "②", en: "Most people seem to have more bad dreams early in the night, progressing toward happier ones before awakening, suggesting that they are working through negative feelings generated during the day.", ref: "大多数人似乎在晚上入睡早期做更多不好的梦，而在醒来前会逐渐做开心一些的梦，这说明人们在梦里逐渐化解白天所产生的负面情绪。",
      ai: { backbone: "主语 Most people、谓语 seem to have、宾语 more bad dreams", structure: ["时间状语 early in the night：说明做噩梦多发的时段","现在分词短语 progressing toward happier ones before awakening：作伴随状语，说明梦境发展的趋势","现在分词短语 suggesting that they are working through negative feelings：作结果状语，补充说明这种现象的含义","后置定语 generated during the day：修饰 negative feelings，说明负面情绪来源"], collocations: ["work through（化解、克服）","negative feelings（负面情绪）","early in the night（夜晚初期）"] }},
    { num: "③", en: "Because our conscious mind is occupied with daily life we don’t always think about the emotional significance of the day’s events—until, it appears, we begin to dream.", ref: "因为我们有意识的大脑被日常事务占据，所以并不总能思考白天所发生的重大事件的情感意义——似乎直到开始做梦时才会。",
      ai: { backbone: "主句：主语 we、谓语 don't always think about、宾语 the emotional significance；句首为 Because 引导的原因状语从句", structure: ["原因状语从句 Because our conscious mind is occupied with daily life：说明主句不思考情感意义的原因","插入语 it appears：表示“看起来、似乎”，使语气更委婉","时间状语从句 until we begin to dream：修饰主句，说明思考行为发生的时机"], collocations: ["be occupied with（被……所占据）","think about（思考）","emotional significance（情感意义）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "progressv.前进，行进", word: "progress", meaning: "v.前进，行进" },
      { raw: "workthrough克服", word: "workthrough克服", meaning: "" }
    ],
        split: "Mostpeopleseemtohavemorebaddreams//earlyinthenight,//progressing towardhappierones//beforeawakening,//suggesting//thattheyareworkingthrough negativefeelings//generatedduringtheday.",
        grammar: ["主干:主+谓+宾", "progressing...现在分词结构作伴随状语", "suggesting...现在分词结构作结果状语", "that引导宾语从句"],
        ref: "大多数人似乎在晚上入睡早期做更多不好的梦，而在醒来前会逐渐做开心一些的梦，这说明人们在梦里逐渐化解白天所产生的负面情绪。"
      }
    ]
  },
  {
    day: 14,
    type: "英一",
    source: "2005 Text 3",
    zh: "这一过程未必是无意识的。卡特赖特认为人们可以对不断重现的噩梦施加有意识的控制。一醒来，立刻确定梦中是什么在困扰你。想象一下你想要它如何结束；下次再做同样的梦时，尽量及时醒来以控制它的进程。多加练习，人们真的可以学会在梦中这样做。",
    sentences: [
    { num: "①", en: "And this process need not be left to the unconscious.", ref: "这一过程未必是无意识的。",
      ai: { backbone: "主语 this process、谓语 need not be left、介词短语 to the unconscious 作状语", structure: ["该句结构简单，无明显修饰成分。"], collocations: ["leave sth to（把……交给）","need not（不必）"] }},
    { num: "②", en: "Cartwright believes one can exercise conscious control over recurring bad dreams.", ref: "卡特赖特认为人们可以对不断重现的噩梦施加有意识的控制。",
      ai: { backbone: "主语 Cartwright、谓语 believes、宾语从句 one can exercise conscious control", structure: ["宾语从句（省略 that）：作 believes 的宾语，转述其观点","介词短语 over recurring bad dreams：修饰 control，说明控制的对象"], collocations: ["exercise control over（对……实施控制）","recurring bad dreams（反复出现的噩梦）","conscious control（有意识的控制）"] }},
    { num: "③", en: "As soon as you awaken, identify what is upsetting about the dream.", ref: "一醒来，立刻确定梦中是什么在困扰你。",
      ai: { backbone: "主句为祈使句 identify（省略主语 you），后接宾语从句；句首 As soon as 引导时间状语从句", structure: ["时间状语从句 As soon as you awaken：说明识别梦中困扰的时机","宾语从句 what is upsetting about the dream：作 identify 的宾语，说明识别的具体内容"], collocations: ["as soon as（一……就……）","identify what is upsetting（确定令人不安之处）"] }},
    { num: "④", en: "Visualize how you would like it to end instead; the next time it occurs, try to wake up just enough to control its course.", ref: "想象一下你想要它如何结束；下次再做同样的梦时，尽量及时醒来以控制它的进程。",
      ai: { backbone: "分号连接两个祈使句：分句1 Visualize（后接 how 宾语从句）；分句2 try to wake up", structure: ["宾语从句 how you would like it to end：作 Visualize 的宾语，说明所想象的内容","时间状语 the next time it occurs：说明再次做梦的时机","不定式 to control its course：作目的状语，说明及时醒来所要达到的目的"], collocations: ["visualize how（想象如何）","wake up just enough（及时醒来）","control the course（控制进程）"] }},
    { num: "⑤", en: "With much practice people can learn to, literally, do it in their sleep.", ref: "多加练习，人们真的可以学会在梦中这样做。",
      ai: { backbone: "主语 people、谓语 can learn to do、宾语 it", structure: ["介词短语 With much practice：作方式状语，说明实现途径","插入语 literally：加强语气，强调“真的、确实”"], collocations: ["with much practice（经过大量练习）","in one's sleep（在睡梦中）"] }}
    ]
  },
  {
    day: 15,
    type: "英一",
    source: "2005 Text 3",
    zh: "总的来说，我们几乎没有理由在意所做的梦，除非它们使我们无法安睡或“从惊恐中醒来”卡特赖特认为。恐怖主义、经济不确定及常见的不安全感都增加了人们的焦虑。那些长期遭受梦魇折磨的人应该寻求治疗专家帮助。对其他人来说，大脑有其化解不良情绪的方法。枕着忧虑睡觉甚至入梦，早上醒来时你会感觉好多了。",
    sentences: [
    { num: "①", en: "At the end of the day, there’s probably little reason to pay attention to our dreams at all unless they keep us from sleeping or “we wake up in a panic,” Cartwright says.", ref: "总的来说，我们几乎没有理由在意所做的梦，除非它们使我们无法安睡或“从惊恐中醒来”卡特赖特认为。",
      ai: { backbone: "there be 句型（There's probably little reason）；Cartwright says 为引述成分", structure: ["不定式 to pay attention to our dreams at all：修饰 reason，说明不关注的原因内容","条件状语从句 unless they keep us from sleeping or we wake up in a panic：说明例外情况"], collocations: ["at the end of the day（归根到底）","pay attention to（注意）","wake up in a panic（惊恐地醒来）"] }},
    { num: "②", en: "Terrorism, economic uncertainties and general feelings of insecurity have increased people’s anxiety.", ref: "恐怖主义、经济不确定及常见的不安全感都增加了人们的焦虑。",
      ai: { backbone: "并列主语 Terrorism, economic uncertainties and general feelings of insecurity、谓语 have increased、宾语 people's anxiety", structure: ["后置定语 of insecurity：修饰 feelings，说明不安全感的具体指向"], collocations: ["economic uncertainties（经济不确定性）","general feelings of insecurity（普遍的不安全感）"] }},
    { num: "③", en: "Those suffering from persistent nightmares should seek help from a therapist.", ref: "那些长期遭受梦魇折磨的人应该寻求治疗专家帮助。",
      ai: { backbone: "主语 Those、谓语 should seek、宾语 help", structure: ["现在分词短语 suffering from persistent nightmares：作后置定语，修饰主语 Those，限定人群范围","介词短语 from a therapist：说明求助的对象"], collocations: ["suffer from（遭受）","persistent nightmares（持续不断的噩梦）","seek help from（向……寻求帮助）"] }},
    { num: "④", en: "For the rest of us, the brain has its ways of working through bad feelings.", ref: "对其他人来说，大脑有其化解不良情绪的方法。",
      ai: { backbone: "主语 the brain、谓语 has、宾语 its ways", structure: ["介词短语 For the rest of us：作状语，限定对象范围","介词短语 of working through bad feelings：修饰 ways，说明方式的具体内容"], collocations: ["for the rest of us（对我们其余人而言）","work through（化解、排解）","bad feelings（不良情绪）"] }},
    { num: "⑤", en: "Sleep—or rather dream—on it and you’ll feel better in the morning.", ref: "枕着忧虑睡觉甚至入梦，早上醒来时你会感觉好多了。",
      ai: { backbone: "祈使句 Sleep on it 加 and 连接结果句 you'll feel better（祈使句 + and 结构）", structure: ["插入语 or rather dream：对 sleep 作补充纠正，强调“甚至入梦”","介词短语 in the morning：作时间状语，说明感觉变好的时间"], collocations: ["sleep on it（带着问题去睡/留待次日再决断）","or rather（更确切地说）","feel better（感觉好转）"] }}
    ]
  },
  {
    day: 16,
    type: "英一",
    source: "2005 Text 4",
    zh: "无论在演讲还是在写作上，美国人都不再期望公众人物在英语语言的使用上展现出技能与天赋：而公众人物自身也不渴求有这种语言驾驭能力。约翰·麦荷特——不仅是语言学家，而且是一位混杂着自由派与保守派观点的善辩者——在其新书《做我们自己的事：语言和音乐的退化，以及为什么我们应该，呃，在意》中认为，20 世纪 60 年代反文化运动的胜利是导致正式英语衰落的主要原因。",
    sentences: [
    { num: "①", en: "Americans no longer expect public figures, whether in speech or in writing, to command the English language with skill and gift. Nor do they aspire to such command themselves.", ref: "无论在演讲还是在写作上，美国人都不再期望公众人物在英语语言的使用上展现出技能与天赋：而公众人物自身也不渴求有这种语言驾驭能力。",
      ai: { backbone: "分句1：主语 Americans、谓语 no longer expect、宾语 public figures、宾语补足语 to command the English language；分句2：Nor 引导部分倒装，主语 they、谓语 aspire to", structure: ["让步状语 whether in speech or in writing（省略形式）：说明无论场合如何","介词短语 with skill and gift：修饰 command，说明驾驭英语的方式","倒装结构 Nor do they aspire to such command themselves：表示与前句相同的否定，说明公众人物自身也不再渴求"], collocations: ["no longer（不再）","public figures（公众人物）","command the English language（驾驭英语语言）","aspire to（渴望）"] }},
    { num: "②", en: "In his latest book, Doing Our Own Thing: The Degradation of language and Music and Why We Should Like, Care, John McWhorter, a linguist and controversialist of mixed liberal and conservative views, sees the triumph of 1960s counter-culture as responsible for the decline of formal English.", ref: "约翰·麦荷特——不仅是语言学家，而且是一位混杂着自由派与保守派观点的善辩者——在其新书《做我们自己的事：语言和音乐的退化，以及为什么我们应该，呃，在意》中认为，20 世纪 60 年代反文化运动的胜利是导致正式英语衰落的主要原因。",
      ai: { backbone: "主语 John McWhorter、谓语 sees、宾语 the triumph of 1960s counter-culture、宾语补足语 as responsible for the decline of formal English", structure: ["状语 In his latest book：交代观点的出处","同位语 Doing Our Own Thing: ...：解释书名，说明著作内容","同位语 a linguist and controversialist of mixed liberal and conservative views：修饰 John McWhorter，说明其身份","see...as... 结构：把……视为……，构成宾语与宾补"], collocations: ["see...as（把……视为）","counter-culture（反主流文化）","be responsible for（是……的原因）","the decline of（……的衰落）"] }}
    ]
  },
  {
    day: 17,
    type: "英一",
    source: "2005 Text 4",
    zh: "责怪纵容放任的 20 世纪 60 年代并不新鲜，但这次却不是对教育退步的又一场批判。麦荷特先生的学术专长是语言的历史与变迁。举例来说，他认为“whom”一词的逐渐消失是自然的，和古英语中词格尾缀的消失一样根本没什么可遗憾的。",
    sentences: [
    { num: "①", en: "Blaming the permissive 1960s is nothing new, but this is not yet another criticism against the decline in education.", ref: "责怪纵容放任的 20 世纪 60 年代并不新鲜，但这次却不是对教育退步的又一场批判。",
      ai: { backbone: "并列句：分句1 动名词短语 Blaming the permissive 1960s 作主语、系动词 is、表语 nothing new；分句2 主语 this、系动词 is not、表语 yet another criticism", structure: ["动名词短语 Blaming the permissive 1960s：作主语，将“责备六十年代”这一行为名词化","后置定语 against the decline in education：修饰 criticism，说明批评的对象"], collocations: ["nothing new（不是什么新鲜事）","criticism against（对……的批评）","the decline in education（教育退步）"] }},
    { num: "②", en: "Mr. McWhorter’s academic speciality is language history and change, and he sees the gradual disappearance of “whom”, for example, to be natural and no more regrettable than the loss of the case-endings of Old English.", ref: "麦荷特先生的学术专长是语言的历史与变迁。举例来说，他认为“whom”一词的逐渐消失是自然的，和古英语中词格尾缀的消失一样根本没什么可遗憾的。",
      ai: { backbone: "并列句：分句1 主语 Mr. McWhorter's academic speciality、系动词 is、表语 language history and change；分句2 主语 he、谓语 sees、宾语 the gradual disappearance of “whom”、宾语补足语 to be natural", structure: ["插入语 for example：举例说明","see...to be... 结构：认为……是……","比较结构 no more regrettable than the loss of the case-endings of Old English：与古英语词格尾缀的消失作比较"], collocations: ["academic speciality（学术专长）","see...to be（认为……是）","no more...than（与……同样不……）","case-endings（词格尾缀）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "regrettableadj.令人惋惜的，令人遗憾的", word: "regrettable", meaning: "adj.令人惋惜的，令人遗憾的" },
      { raw: "casen.(语法中的)格", word: "case", meaning: "n.(语法中的)格" },
      { raw: "academicspeciality学术专长", word: "academicspeciality学术专长", meaning: "" }
    ],
        split: "Mr.McWhorter’sacademicspecialityislanguagehistoryandchange,//andhesees thegradualdisappearanceof“whom”,//forexample,//tobenatural//andno moreregrettable//thanthelossofthecase-endingsofOldEnglish.",
        grammar: ["主干:主+系+表and主+谓+宾+宾补", "分句2结构提炼：heseesAtobenaturalandnomoreregrettablethanB", "and并列tobenatural和nomoreregrettable", "than...作比较状语", "比较结构提炼：Aisno+比较级+thanB表示“A和B一样不...”", "e.g.Heisnobetterthanyou.他和你一样好不到哪去。"],
        ref: "麦荷特先生的学术专长是语言的历史与变迁。举例来说，他认为“whom”一词的逐渐消失是自然的，和古英语中词格尾缀的消失一样根本没什么可遗憾的。"
      }
    ]
  },
  {
    day: 18,
    type: "英一",
    source: "2005 Text 4",
    zh: "然而，对真实和个性的狂热推崇，即“做我们自己的事”，已经招致了正式的演讲、写作、诗歌及音乐的消亡。在 20 世纪 60 年代以前，就算是受教育不太多的人在下笔时都会寻求一种高格调；而在那之后,即使是最受好评的文章也力求在书面上体现口语化。同样，在诗歌方面，极具个性化与表现力的风格是唯一能够体现真实生动的形式。无论是在口语还是书面语中，随意言谈胜过了正式讲话，即兴发挥也胜过了精雕细琢。",
    sentences: [
    { num: "①", en: "But the cult of the authentic and the personal, “doing our own thing”, has spelt the death of formal speech, writing, poetry and music.", ref: "然而，对真实和个性的狂热推崇，即“做我们自己的事”，已经招致了正式的演讲、写作、诗歌及音乐的消亡。",
      ai: { backbone: "主语 the cult of the authentic and the personal、谓语 has spelt、宾语 the death of formal speech, writing, poetry and music", structure: ["同位语 “doing our own thing”：解释 the cult 的具体含义，即“做自己的事”","介词短语 of formal speech, writing, poetry and music：修饰 death，列举消亡的对象"], collocations: ["the cult of（对……的狂热追捧）","spell the death of（招致……的灭亡）"] }},
    { num: "②", en: "While even the modestly educated sought an elevated tone when they put pen to paper before the 1960s, even the most well regarded writing since then has sought to capture spoken English on the page.", ref: "在 20 世纪 60 年代以前，就算是受教育不太多的人在下笔时都会寻求一种高格调；而在那之后,即使是最受好评的文章也力求在书面上体现口语化。",
      ai: { backbone: "主句：主语 even the most well regarded writing、谓语 has sought to capture、宾语 spoken English；句首 While 引导让步状语从句", structure: ["让步状语从句 While even the modestly educated sought an elevated tone：与主句形成对比，说明时代差异","时间状语从句 when they put pen to paper：修饰 sought，说明下笔写作之时","时间状语 since then：说明二十世纪六十年代之后"], collocations: ["put pen to paper（动笔写作）","an elevated tone（高格调）","capture spoken English（体现口语特征）","the well regarded writing（备受好评的文章）"] }},
    { num: "③", en: "Equally, in poetry, the highly personal, performative genre is the only form that could claim real liveliness.", ref: "同样，在诗歌方面，极具个性化与表现力的风格是唯一能够体现真实生动的形式。",
      ai: { backbone: "主语 the highly personal, performative genre、系动词 is、表语 the only form", structure: ["定语从句 that could claim real liveliness：修饰 form，限定其能力","状语 in poetry：限定论述范围"], collocations: ["the only form（唯一的形式）","claim real liveliness（体现真正的生动）"] }},
    { num: "④", en: "In both oral and written English, talking is triumphing over speaking, spontaneity over craft.", ref: "无论是在口语还是书面语中，随意言谈胜过了正式讲话，即兴发挥也胜过了精雕细琢。",
      ai: { backbone: "并列句：分句1 主语 talking、谓语 is triumphing over、宾语 speaking；分句2 主语 spontaneity、省略谓语，接 over craft", structure: ["状语 In both oral and written English：限定范围","省略结构 spontaneity over craft：承前省略 is triumphing，使句式凝练"], collocations: ["oral and written English（口语和书面英语）","triumph over（战胜、胜过）"] }}
    ]
  },
  {
    day: 19,
    type: "英一",
    source: "2005 Text 4",
    zh: "麦荷特先生从雅俗文化中列举了大量有趣的例子，从而说明他所记录的趋势是确凿无疑的。但就书中副标题提出的问题“为什么我们应该，呃，在意”，答案却不够明确。作为语言学家，麦荷特承认人类各种各样的语言，包括像黑人英语这样的非标准语言，都具有强大的表达力——世上没有传达不了复杂思想的语言或方言。与其他大多数人不同，麦荷特先生并没有坚持认为“我们说话方式不规范就会让我们无法准确地思考”。",
    sentences: [
    { num: "①", en: "Illustrated with an entertaining array of examples from both high and low culture, the trend that Mr. McWhorter documents is unmistakable.", ref: "麦荷特先生从雅俗文化中列举了大量有趣的例子，从而说明他所记录的趋势是确凿无疑的。",
      ai: { backbone: "主语 the trend、系动词 is、表语 unmistakable", structure: ["过去分词短语 Illustrated with an entertaining array of examples...：作方式状语，说明趋势之所以确凿的依据","定语从句 that Mr. McWhorter documents：修饰 the trend，说明趋势的记录者"], collocations: ["an array of（一系列）","high and low culture（雅俗文化）","be unmistakable（确凿无疑）"] }},
    { num: "②", en: "But it is less clear, to take the question of his subtitle, why we should, like, care.", ref: "但就书中副标题提出的问题“为什么我们应该，呃，在意”，答案却不够明确。",
      ai: { backbone: "形式主语 it、系动词 is、表语 less clear、真正主语为 why 引导的主语从句", structure: ["插入语 to take the question of his subtitle：交代论述切入的角度","主语从句 why we should, like, care：作句子的真正主语"], collocations: ["less clear（不那么明确）","take the question of（就……问题进行探讨）"] }},
    { num: "③", en: "As a linguist, he acknowledges that all varieties of human language, including non-standard ones like Black English, can be powerfully expressive—there exists no language or dialect in the world that cannot convey complex ideas.", ref: "作为语言学家，麦荷特承认人类各种各样的语言，包括像黑人英语这样的非标准语言，都具有强大的表达力——世上没有传达不了复杂思想的语言或方言。",
      ai: { backbone: "主句：主语 he、谓语 acknowledges、宾语从句 that all varieties of human language can be powerfully expressive；破折号后为 there be 句型作补充", structure: ["状语 As a linguist：说明作者的专业视角","插入语 including non-standard ones like Black English：举例说明所谓“各种语言”的范围","定语从句 that cannot convey complex ideas：修饰 no language or dialect，强调不存在例外"], collocations: ["acknowledge that（承认）","varieties of（各种各样的）","convey complex ideas（传达复杂的思想）"] }},
    { num: "④", en: "He is not arguing, as many do, that we can no longer think straight because we do not talk proper.", ref: "与其他大多数人不同，麦荷特先生并没有坚持认为“我们说话方式不规范就会让我们无法准确地思考”。",
      ai: { backbone: "主语 He、谓语 is not arguing、宾语从句 that we can no longer think straight", structure: ["插入语 as many do：与其他人的观点作对照","原因状语从句 because we do not talk proper：说明无法思考的原因"], collocations: ["argue that（主张、坚持认为）","think straight（思路清晰）","no longer（不再）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "linguistn.语言学家", word: "linguist", meaning: "n.语言学家" },
      { raw: "acknowledgev.承认", word: "acknowledge", meaning: "v.承认" },
      { raw: "dialectn.方言", word: "dialect", meaning: "n.方言" },
      { raw: "conveyv.传达", word: "convey", meaning: "v.传达" }
    ],
        split: "Asalinguist,//heacknowledges//thatallvarietiesofhumanlanguage,//including non-standardones//likeBlackEnglish,//canbepowerfullyexpressive—//thereexists nolanguageordialect//intheworld//thatcannotconveycomplexideas.",
        grammar: ["主干:主+谓+宾从", "第2个that引导定语从句（限定languageordialect）注意定语从句隔离结构", "thereexists=therebe表示“有/存在”固定句型"],
        ref: "作为语言学家，麦荷特承认人类各种各样的语言，包括像黑人英语这样的非标准语言，都具有强大的表达力---世上没有传达不了复杂思想的语言或方言。"
      },
      {
        sentNum: "④",
        vocab: [
      { raw: "straightadv.正确地，清楚地", word: "straight", meaning: "adv.正确地，清楚地" },
      { raw: "talkproper规范地表达/说话", word: "talkproper规范地", meaning: "表达/说话" }
    ],
        split: "Heisnotarguing,//asmanydo,//thatwecannolongerthinkstraight//becausewe donottalkproper.",
        grammar: ["主干:主+谓+宾从", "否定处理：1.否定位置转移2.否定词变化/替换", "e.g.Idon’tthinkyouareright.", "我不认为你是对的。", "=我认为你是不对的。", "=我认为你是错的。"],
        ref: "1：他并不是像许多人那样，认为我们由于说话不得体而无法清晰地思考。参考译文2：与其他大多数人不同，麦荷特先生并没有坚持认为“我们说话方式不规范就会让我们无法准确地思考”。"
      }
    ]
  },
  {
    day: 20,
    type: "英一",
    source: "2005 Text 4",
    zh: "俄罗斯人深爱自己的语言，他们的脑海中深印着大段大段的诗歌；而意大利的政客们则往往精心准备演讲，尽管这在大多数讲英语的人们看来已经过时了。麦荷特先生承认正式语言并非绝对的不可或缺，他也没有提议要进行彻底的教育改革——他其实只是为那些美好多过实用的事物的消逝而哀叹。我们现在用“纸盘”而非“瓷盘”盛着我们的英语大餐。这或许令人遗憾,但也许又是不可避免的。",
    sentences: [
    { num: "①", en: "Russians have a deep love for their own language and carry large chunks of memorized poetry in their heads, while Italian politicians tend to elaborate speech that would seem old-fashioned to most English-speakers.", ref: "俄罗斯人深爱自己的语言，他们的脑海中深印着大段大段的诗歌；而意大利的政客们则往往精心准备演讲，尽管这在大多数讲英语的人们看来已经过时了。",
      ai: { backbone: "并列句：分句1 主语 Russians、并列谓语 have a deep love 和 carry large chunks；分句2 主语 Italian politicians、谓语 tend to elaborate、宾语 speech", structure: ["定语从句 that would seem old-fashioned to most English-speakers：修饰 speech，说明演讲给英语母语者的观感"], collocations: ["have a deep love for（深爱）","large chunks of（大段大段的）","tend to（倾向于）"] }},
    { num: "②", en: "Mr. McWhorter acknowledges that formal language is not strictly necessary, and proposes no radical education reforms—he is really grieving over the loss of something beautiful more than useful.", ref: "麦荷特先生承认正式语言并非绝对的不可或缺，他也没有提议要进行彻底的教育改革——他其实只是为那些美好多过实用的事物的消逝而哀叹。",
      ai: { backbone: "主语 Mr. McWhorter、并列谓语 acknowledges 和 proposes；破折号后为独立分句 he is really grieving over...", structure: ["宾语从句 that formal language is not strictly necessary：作 acknowledges 的宾语","比较结构 something beautiful more than useful：修饰 the loss 的对象，说明消逝之物“美好多过实用”"], collocations: ["strictly necessary（绝对必要）","radical education reforms（激进的教育改革）","grieve over（为……而哀叹）"] }},
    { num: "③", en: "We now take our English “on paper plates instead of china”.", ref: "我们现在用“纸盘”而非“瓷盘”盛着我们的英语大餐。",
      ai: { backbone: "主语 We、谓语 take、宾语 our English、状语 on paper plates instead of china", structure: ["该句为比喻用法：以“纸盘代替瓷盘”喻指随意、粗糙的语言习惯，结构上无复杂修饰"], collocations: ["on paper plates（用纸盘，喻随意）","instead of（而不是）"] }},
    { num: "④", en: "A shame, perhaps, but probably an inevitable one.", ref: "这或许令人遗憾,但也许又是不可避免的。",
      ai: { backbone: "省略句：完整形式为 It is a shame... but it is probably an inevitable one（主语 it、系动词 is、表语 a shame / an inevitable one）", structure: ["插入语 perhaps：使语气委婉","省略结构：a shame 与 an inevitable one 并列作表语"], collocations: ["a shame（一件憾事）","inevitable（不可避免的）"] }}
    ]
  },
  {
    day: 21,
    type: "英一",
    source: "2006 Text 1",
    zh: "尽管“无休止地谈论差异”，美国社会却是一部使人们同化的惊人机器。大众文化有着“服饰和言语上大众化的一致，以及随意和不拘礼节”的特征。人们被一种由 19 世纪的百货商场掀起的“消费文化”所同化，这些商店“在体面的环境中供应琳琅满目的商品”。这些不是迎合知识精英的私密商店，而是“不论阶级或背景，任何人都可以进入的百货商店。这使得购物转变为一种公共和大众的行为”。大众传媒、广告和体育赛事是同化的其他推动力。",
    sentences: [
    { num: "①", en: "In spite of “endless talk of difference,” American society is an amazing machine for homogenizing people.", ref: "尽管“无休止地谈论差异”，美国社会却是一部使人们同化的惊人机器。",
      ai: { backbone: "主语 American society、系动词 is、表语 an amazing machine", structure: ["让步状语 In spite of “endless talk of difference”：与主句形成转折","介词短语 for homogenizing people：修饰 machine，说明机器的功能"], collocations: ["in spite of（尽管）","endless talk of（无休止地谈论）","homogenize people（使人们同质化）"] }},
    { num: "②", en: "There is “the democratizing uniformity of dress and discourse, and the casualness and absence of deference” characteristic of popular culture.", ref: "大众文化有着“服饰和言语上大众化的一致，以及随意和不拘礼节”的特征。",
      ai: { backbone: "There be 结构，表语为并列名词短语 the democratizing uniformity of dress and discourse, and the casualness and absence of deference", structure: ["后置定语 characteristic of popular culture：修饰前面的并列名词短语，说明这些特征为大众文化所特有","并列名词短语 the democratizing uniformity of dress and discourse...and the casualness and absence of deference：由 and 连接的两个并列成分，共同作表语，从正面与负面两个角度描述大众文化的特征"], collocations: ["be characteristic of（是……的特征）","popular culture（大众文化）","absence of deference（缺乏恭敬）"] }},
    { num: "③", en: "People are absorbed into “a culture of consumption” launched by the 19th-century department stores that offered “vast arrays of goods in an elegant atmosphere.", ref: "人们被一种由 19 世纪的百货商场掀起的“消费文化”所同化，这些商店“在体面的环境中供应琳琅满目的商品”。",
      ai: { backbone: "主语 People、谓语 are absorbed、介词短语 into “a culture of consumption” 作状语", structure: ["过去分词短语 launched by the 19th-century department stores：作后置定语，修饰 a culture of consumption，说明消费文化由 19 世纪百货商店开启","定语从句 that offered “vast arrays of goods in an elegant atmosphere”：修饰 department stores，说明百货商店提供海量商品及优雅环境"], collocations: ["be absorbed into（被……吸收/融入）","a culture of consumption（消费文化）","department stores（百货商店）","vast arrays of（大量的）"] }},
    { num: "④", en: "Instead of intimate shops catering to a knowledgeable elite” these were stores “anyone could enter, regardless of class or background.", ref: "这些不是迎合知识精英的私密商店，而是“不论阶级或背景，任何人都可以进入的百货商店。",
      ai: { backbone: "主语 these、系动词 were、表语 stores；句首 Instead of... 作状语", structure: ["介词短语 Instead of intimate shops：作比较状语，说明这些商店与旧式精品店形成对比","现在分词短语 catering to a knowledgeable elite：作后置定语，修饰 intimate shops，说明精品店的服务对象","省略引导词的定语从句 anyone could enter：修饰 stores，说明任何人都能进入","介词短语 regardless of class or background：作让步状语，强调进入不受阶层与背景限制"], collocations: ["instead of（而不是）","cater to（迎合，满足……的需求）","regardless of（不论，不管）"] }},
    { num: "⑤", en: "This turned shopping into a public and democratic act.”", ref: "这使得购物转变为一种公共和大众的行为”。",
      ai: { backbone: "主语 This、谓语 turned、宾语 shopping、介词短语 into a public and democratic act 作宾补", structure: ["介词短语 into a public and democratic act：作宾语补足语，说明购物被转变为何种性质的行为"], collocations: ["turn sth into（把……变成）","a public and democratic act（公开而民主的行为）"] }},
    { num: "⑥", en: "The mass media, advertising and sports are other forces for homogenization.", ref: "大众传媒、广告和体育赛事是同化的其他推动力。",
      ai: { backbone: "主语 The mass media, advertising and sports、系动词 are、表语 other forces", structure: ["介词短语 for homogenization：作后置定语，修饰 forces，说明这些力量是促成同质化的力量"], collocations: ["mass media（大众传媒）","forces for（促进……的力量）","homogenization（同质化）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "absorbv.吸收，同化", word: "absorb", meaning: "v.吸收，同化" },
      { raw: "launchv.发起", word: "launch", meaning: "v.发起" },
      { raw: "arrayn.一系列，一批", word: "array", meaning: "n.一系列，一批" },
      { raw: "departmentstore百货商店", word: "departmentstore百货商店", meaning: "" }
    ],
        split: "Peopleareabsorbed//into“acultureofconsumption”//launchedbythe 19th-centurydepartmentstores//thatoffered“vastarraysofgoods//inanelegant atmosphere.",
        grammar: ["主干:主+谓", "launchedby...作后置定语", "that引导定语从句（限定departmentstores）", "AislaunchedbyBA被B发起=B发起A（暗含因果关系）"],
        ref: "人们被一种由19世纪的百货商场掀起的“消费文化”所同化，这些商店“在体面的环境中供应琳琅满目的商品”。"
      }
    ]
  },
  {
    day: 22,
    type: "英一",
    source: "2006 Text 1",
    zh: "移民正在快速融入这种共同文化，这也许不太具有提升作用，但也几乎不可能有什么害处。在为“国家移民论坛”撰稿时，格雷戈里·罗德里格兹写道，如今的移民既未达到前所未有的水平也没有拒斥同化。1998 年移民占人口总数的 9.8%，1900 年占 13.6%。在 1990 年之前的 10 年中，每有 1000 个居民，便有 3.1 个移民初次来到（美国）；在 1890 年之前的 10年中，二者比值为 9.2 :1000。现在，考虑一下同化的三个指标——语言、住房自有和异族通婚。",
    sentences: [
    { num: "①", en: "Immigrants are quickly fitting into this common culture, which may not be altogether elevating but is hardly poisonous.", ref: "移民正在快速融入这种共同文化，这也许不太具有提升作用，但也几乎不可能有什么害处。",
      ai: { backbone: "主语 Immigrants、谓语 are fitting into、宾语 this common culture", structure: ["非限制性定语从句 which may not be altogether elevating but is hardly poisonous：修饰 this common culture，补充说明该文化的性质","并列表语 not...but...：may not be...but is... 说明这种文化虽谈不上提升性，但也几乎无害"], collocations: ["fit into（融入）","common culture（共同文化）","not...but（不是……而是）"] }},
    { num: "②", en: "Writing for the National Immigration Forum, Gregory Rodriguez reports that today’s immigration is neither at unprecedented levels nor resistant to assimilation.", ref: "在为“国家移民论坛”撰稿时，格雷戈里·罗德里格兹写道，如今的移民既未达到前所未有的水平也没有拒斥同化。",
      ai: { backbone: "主语 Gregory Rodriguez、谓语 reports、宾语从句 that today's immigration is neither at unprecedented levels nor resistant to assimilation", structure: ["现在分词短语 Writing for the National Immigration Forum：作状语，说明作者为谁撰稿的身份背景","宾语从句 that today's immigration is neither...nor...：作 reports 的宾语，说明其报道的核心内容","并列结构 neither...nor...：连接两个表语，双重否定两种情形"], collocations: ["write for（为……撰稿）","at unprecedented levels（处于空前水平）","neither...nor（既不……也不……）","resistant to（对……有抵抗力的）"] }},
    { num: "③", en: "In 1998 immigrants were 9.8 percent of the population; in 1900, 13.6 percent.", ref: "1998 年移民占人口总数的 9.8%，1900 年占 13.6%。",
      ai: { backbone: "分号连接两个并列分句：分句1 主语 immigrants、系动词 were、表语 9.8 percent of the population；分句2 为省略结构", structure: ["时间状语 In 1998 / in 1900：分别修饰两个分句，说明对比的时间点","省略结构 in 1900, 13.6 percent：分句2 省略了主语与系动词，使表达简洁并与前文形成对比"], collocations: ["percent of the population（占总人口的百分比）"] }},
    { num: "④", en: "In the 10 years prior to 1990, 3.1 immigrants arrived for every 1,000 residents; in the 10 years prior to 1890, 9.2 for every 1,000.", ref: "在 1990 年之前的 10 年中，每有 1000 个居民，便有 3.1 个移民初次来到（美国）；在 1890 年之前的 10年中，二者比值为 9.2 :1000。",
      ai: { backbone: "分号连接两个并列分句：分句1 主语 3.1 immigrants、谓语 arrived；分句2 为省略结构", structure: ["时间状语 In the 10 years prior to 1990 / prior to 1890：分别修饰两个分句，说明对比的时间段","省略结构 9.2 for every 1,000：分句2 省略了 immigrants arrived，保持并列简洁"], collocations: ["prior to（在……之前）","for every 1,000 residents（每 1000 名居民中）"] }},
    { num: "⑤", en: "Now, consider three indices of assimilation—language, home ownership and intermarriage.", ref: "现在，考虑一下同化的三个指标——语言、住房自有和异族通婚。",
      ai: { backbone: "祈使句，谓语 consider、宾语 three indices of assimilation", structure: ["破折号后的并列成分 language, home ownership and intermarriage：作 indices 的同位语，具体列举三个同化指标"], collocations: ["home ownership（住房自有率）","indices of assimilation（同化指标）"] }}
    ]
  },
  {
    day: 23,
    type: "英一",
    source: "2006 Text 1",
    zh: "1990 年人口普查结果显示，“来自于 15 个最常见原籍国的大多数移民在居住十年后英语都讲得‘不错’或‘非常好’”。移民的子女往往通晓双语并精通英语。“到了第三代，族裔语言在大部分移民家庭中已经消失。因此美国被形容为语言的“墓地”。到 1996 年止，1970年前到达的、外国出生的移民住房自有率达 75.6%，高于本国出生的美国人 69.8%的比例。",
    sentences: [
    { num: "①", en: "The 1990 Census revealed that “a majority of immigrants from each of the fifteen most common countries of origin spoke English ‘well’ or ‘very well’ after ten years of residence.”", ref: "1990 年人口普查结果显示，“来自于 15 个最常见原籍国的大多数移民在居住十年后英语都讲得‘不错’或‘非常好’”。",
      ai: { backbone: "主语 The 1990 Census、谓语 revealed、宾语从句 that a majority of immigrants spoke English", structure: ["宾语从句 that a majority of immigrants...spoke English “well” or “very well”：作 revealed 的宾语，说明普查揭示的内容","后置定语 from each of the fifteen most common countries of origin：修饰 immigrants，限定移民来源国","时间状语 after ten years of residence：修饰 spoke，说明掌握英语的时间条件"], collocations: ["countries of origin（原籍国）","after ten years of residence（居住十年之后）","a majority of（大多数）"] }},
    { num: "②", en: "The children of immigrants tend to be bilingual and proficient in English.", ref: "移民的子女往往通晓双语并精通英语。",
      ai: { backbone: "主语 The children of immigrants、谓语 tend to be、表语 bilingual and proficient", structure: ["不定式短语 to be bilingual and proficient in English：作 tend 的宾语，说明移民子女的普遍状态","介词短语 in English：修饰 proficient，说明精通的具体领域"], collocations: ["tend to（往往，倾向于）","be proficient in（精通……）"] }},
    { num: "③", en: "“By the third generation, the original language is lost in the majority of immigrant families.”", ref: "“到了第三代，族裔语言在大部分移民家庭中已经消失。",
      ai: { backbone: "主语 the original language、谓语 is lost；句首 By the third generation 为时间状语", structure: ["时间状语 By the third generation：修饰整个句子，说明到第三代时的情况","介词短语 in the majority of immigrant families：作状语，限定范围"], collocations: ["by the third generation（到第三代时）","the majority of（大多数）"] }},
    { num: "④", en: "Hence the description of America as a “graveyard” for languages.", ref: "因此美国被形容为语言的“墓地”。",
      ai: { backbone: "省略句：省略主谓，仅保留名词短语 the description of America as a “graveyard” for languages，Hence 承上启下", structure: ["介词短语 as a “graveyard” for languages：作 America 的补足说明，把美国比作语言的“坟墓”"], collocations: ["hence（因此，由此）","the description of...as（把……描述为）"] }},
    { num: "⑤", en: "By 1996 foreign-born immigrants who had arrived before 1970 had a home ownership rate of 75.6 percent, higher than the 69.8 percent rate among native-born Americans.", ref: "到 1996 年止，1970年前到达的、外国出生的移民住房自有率达 75.6%，高于本国出生的美国人 69.8%的比例。",
      ai: { backbone: "主语 foreign-born immigrants、谓语 had、宾语 a home ownership rate of 75.6 percent", structure: ["时间状语 By 1996：修饰整个句子，说明时间界限","定语从句 who had arrived before 1970：修饰 immigrants，限定对象为 1970 年前抵达者","比较结构 higher than the 69.8 percent rate among native-born Americans：与本土出生美国人的自有住房率作对比"], collocations: ["home ownership rate（住房自有率）","native-born Americans（本土出生的美国人）","higher than（高于）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "Censusn.人口普查", word: "Census", meaning: "n.人口普查" },
      { raw: "revealv.揭示，透露", word: "reveal", meaning: "v.揭示，透露" },
      { raw: "residencen.居住，定居", word: "residence", meaning: "n.居住，定居" },
      { raw: "countriesoforigin原籍国", word: "countriesoforigin原籍国", meaning: "" }
    ],
        split: "The1990Censusrevealed//that“amajorityofimmigrants//fromeachofthe fifteenmostcommoncountriesoforiginspokeEnglish‘well’or‘verywell’//after tenyearsofresidence.”",
        grammar: ["主干:主+谓+宾从", "that引导宾语从句", "countriesoforigin原籍国"],
        ref: "1990年人口普查结果显示，“来自于15个最常见原籍国的大多数移民在居住十年后英语都讲得‘不错’或‘非常好’”。"
      }
    ]
  },
  {
    day: 24,
    type: "英一",
    source: "2006 Text 1",
    zh: "外国出生的亚裔和西班牙裔移民的异族通婚率比美国本土出生的黑人和白人的异族通婚率要高”。到了第三代，三分之一的西班牙裔女性嫁给了非西班牙裔，41%的亚裔美国女性嫁给了非亚裔。",
    sentences: [
    { num: "①", en: "Foreign-born Asians and Hispanics “have higher rates of intermarriage than do U.S.-born whites and blacks.”", ref: "外国出生的亚裔和西班牙裔移民的异族通婚率比美国本土出生的黑人和白人的异族通婚率要高”。",
      ai: { backbone: "主语 Foreign-born Asians and Hispanics、谓语 have、宾语 higher rates of intermarriage", structure: ["比较结构 than do U.S.-born whites and blacks：than 后采用倒装语序，与主语进行比较，说明外裔亚裔与西裔通婚率更高","后置定语 of intermarriage：修饰 rates，说明是通婚比率"], collocations: ["rates of intermarriage（通婚率）","foreign-born（在国外出生的）","higher than（高于）"] }},
    { num: "②", en: "By the third generation, one third of Hispanic women are married to non-Hispanics, and 41 percent of Asian-American women are married to non-Asians.", ref: "到了第三代，三分之一的西班牙裔女性嫁给了非西班牙裔，41%的亚裔美国女性嫁给了非亚裔。",
      ai: { backbone: "and 连接两个并列分句：分句1 主语 one third of Hispanic women、谓语 are married to、宾语 non-Hispanics；分句2 主语 41 percent of Asian-American women、谓语 are married to、宾语 non-Asians", structure: ["时间状语 By the third generation：修饰整个句子，说明到第三代时的情况","并列连词 and：连接两个结构相同的分句，形成对仗","介词短语 to non-Hispanics / to non-Asians：作 married 的补足，说明通婚对象"], collocations: ["be married to（与……结婚）","by the third generation（到第三代时）"] }}
    ]
  },
  {
    day: 25,
    type: "英一",
    source: "2006 Text 1",
    zh: "罗德里格兹指出，世界各地偏远乡村的儿童都是像阿诺德·施瓦辛格和加斯·布鲁克斯这样的超级明星的粉丝，然而“有些美国人担心，居住在美国境内的移民依然以某种方式不受这个国家同化力量的影响”在美国存在引起分歧的问题和小范围涌动的怒火吗？确实存在。美国太大，什么情形都会有一点。但是，尤其在美国动荡过去的背景下来看，今天的社会指标几乎并未显示出一种黯淡退化的社会环境。",
    sentences: [
    { num: "①", en: "Rodriguez notes that children in remote villages around the world are fans of superstars like Arnold Schwarzenegger and Garth Brooks, yet “some Americans fear that immigrants living within the United States remain somehow immune to the nation’s assimilative power.” Are there divisive issues and pockets of seething anger in America?", ref: "罗德里格兹指出，世界各地偏远乡村的儿童都是像阿诺德·施瓦辛格和加斯·布鲁克斯这样的超级明星的粉丝，然而“有些美国人担心，居住在美国境内的移民依然以某种方式不受这个国家同化力量的影响”在美国存在引起分歧的问题和小范围涌动的怒火吗？",
      ai: { backbone: "主语 Rodriguez、谓语 notes、宾语从句 that children...yet “some Americans fear that...”", structure: ["宾语从句 that children in remote villages...yet some Americans fear...：作 notes 的宾语，用 yet 连接两层并列内容","宾语从句 that immigrants...remain somehow immune to...：作 fear 的宾语，说明美国人担忧的内容","现在分词短语 living within the United States：作后置定语，修饰 immigrants","介词短语 like Arnold Schwarzenegger and Garth Brooks：作后置定语，举例说明超级明星","疑问句 Are there divisive issues and pockets of seething anger in America?：提出反问，追问美国是否存在分裂性问题与暗涌的愤怒"], collocations: ["be immune to（对……免疫/不受影响）","assimilative power（同化力量）","pockets of seething anger（暗涌的愤怒）"] }},
    { num: "②", en: "Indeed.", ref: "确实存在。",
      ai: { backbone: "独立使用的副词，作整句的承接语，对上一问句作出肯定回答", structure: ["该句为单个副词 Indeed 独立成句，无主干成分，起承上启下的肯定强调作用"], collocations: ["indeed（确实，的确）"] }},
    { num: "③", en: "It is big enough to have a bit of everything.", ref: "美国太大，什么情形都会有一点。",
      ai: { backbone: "主语 It、系动词 is、表语 big enough；不定式短语作结果状语", structure: ["不定式短语 to have a bit of everything：作结果状语，说明“足够大”所导致的结果","enough to...：表达到达某程度后足以产生某种结果"], collocations: ["big enough to（大到足以）","a bit of（一点，少量）"] }},
    { num: "④", en: "But particularly when viewed against America’s turbulent past, today’s social indices hardly suggest a dark and deteriorating social environment.", ref: "但是，尤其在美国动荡过去的背景下来看，今天的社会指标几乎并未显示出一种黯淡退化的社会环境。",
      ai: { backbone: "主语 today's social indices、谓语 suggest、宾语 a dark and deteriorating social environment", structure: ["时间状语从句 when viewed against America's turbulent past：when 后省略了 they are，说明与何对照","程度副词 hardly：修饰 suggest，表示“几乎不”，否定社会指标预示恶化"], collocations: ["when viewed against（与……相比来看）","social indices（社会指标）","turbulent past（动荡的过去）"] }}
    ]
  },
  {
    day: 26,
    type: "英一",
    source: "2006 Text 2",
    zh: "众所周知，埃文河畔的斯特拉特福德镇只有一个产业——威廉·莎士比亚，却有两个泾渭分明且日益敌对的派别。一方是皇家莎士比亚剧团（RSC），它在埃文河畔的莎士比亚纪念剧院上演精彩绝伦的剧目。另一方是当地居民，他们在很大程度上依赖那些来此不是为了看戏，而是为了看安妮·海瑟薇（注：莎士比亚的妻子）小屋、莎士比亚出生地以及其他景点的观光客而生活。斯特拉福德镇“令人尊敬”的居民们认为剧院没有为他们增添哪怕一分钱的收入。他们毫不掩饰地讨厌皇家莎士比亚剧团的演员：这些演员们留着长发、蓄着胡须、穿着凉鞋，吵吵嚷嚷。当你想到养活他们的莎士比亚本人就是个（留着胡须的）演员而且噪音制造也有他一份时，这真是绝妙的讽刺。",
    sentences: [
    { num: "①", en: "Stratford-on-Avon, as we all know, has only one industry --William Shakespeare -- but there are two distinctly separate and increasingly hostile branches.", ref: "众所周知，埃文河畔的斯特拉特福德镇只有一个产业——威廉·莎士比亚，却有两个泾渭分明且日益敌对的派别。",
      ai: { backbone: "but 连接两个并列分句：分句1 主语 Stratford-on-Avon、谓语 has、宾语 only one industry；分句2 为 there be 结构", structure: ["插入语 as we all know：补充交代背景常识","破折号内 William Shakespeare：作 industry 的同位语，指明该产业就是莎士比亚","there be 结构 there are two distinctly separate and increasingly hostile branches：说明存在两个截然分开且日益敌对的分支"], collocations: ["as we all know（众所周知）","distinctly separate（截然分开的）","increasingly hostile（日益敌对的）"] }},
    { num: "②", en: "There is the Royal Shakespeare Company (RSC), which presents superb productions of the plays at the Shakespeare Memorial Theatre on the Avon.", ref: "一方是皇家莎士比亚剧团（RSC），它在埃文河畔的莎士比亚纪念剧院上演精彩绝伦的剧目。",
      ai: { backbone: "There be 结构，主语 the Royal Shakespeare Company (RSC)", structure: ["非限制性定语从句 which presents superb productions of the plays：修饰 RSC，说明其演出活动","地点状语 at the Shakespeare Memorial Theatre on the Avon：说明演出地点"], collocations: ["superb productions（精彩演出）","memorial theatre（纪念剧院）"] }},
    { num: "③", en: "And there are the townsfolk who largely live off the tourists who come, not to see the plays, but to look at Anne Hathaway's Cottage, Shakespeare's birthplace and the other sights.", ref: "另一方是当地居民，他们在很大程度上依赖那些来此不是为了看戏，而是为了看安妮·海瑟薇（注：莎士比亚的妻子）小屋、莎士比亚出生地以及其他景点的观光客而生活。",
      ai: { backbone: "there be 结构，主语 the townsfolk；其后跟 who 引导的定语从句", structure: ["定语从句 who largely live off the tourists：修饰 townsfolk，说明镇民以游客为生","定语从句 who come：修饰 tourists，说明游客的到来","并列不定式短语 not to see the plays, but to look at Anne Hathaway's Cottage...：作目的状语，说明游客并非看戏而是参观","同位语 Shakespeare's birthplace：解释 Anne Hathaway's Cottage 的身份"], collocations: ["live off（靠……为生）","not...but（不是……而是）","the other sights（其他景点）"] }},
    { num: "④", en: "The worthy residents of Stratford doubt that the theater adds a penny to their revenue.", ref: "斯特拉福德镇“令人尊敬”的居民们认为剧院没有为他们增添哪怕一分钱的收入。",
      ai: { backbone: "主语 The worthy residents of Stratford、谓语 doubt、宾语从句 that the theater adds a penny to their revenue", structure: ["宾语从句 that the theater adds a penny to their revenue：作 doubt 的宾语，说明居民怀疑的内容","后置定语 of Stratford：修饰 residents，限定地点"], collocations: ["add to revenue（增加收入）","worthy residents（体面的居民）"] }},
    { num: "⑤", en: "They frankly dislike the RSC's actors, them with their long hair and beards and sandals and noisiness.", ref: "他们毫不掩饰地讨厌皇家莎士比亚剧团的演员：这些演员们留着长发、蓄着胡须、穿着凉鞋，吵吵嚷嚷。",
      ai: { backbone: "主语 They、谓语 dislike、宾语 the RSC's actors", structure: ["代词 them 加介词短语 with their long hair...：作 actors 的同位补充，强调演员的外貌与行为特征","介词短语 with their long hair and beards and sandals and noisiness：说明演员的外形与喧闹作风"], collocations: ["frankly dislike（直率地讨厌）","long hair and beards（长发与胡须）"] }},
    { num: "⑥", en: "It's all deliciously ironic when you consider that Shakespeare, who earns their living, was himself an actor (with a beard) and did his share of noise-making.", ref: "当你想到养活他们的莎士比亚本人就是个（留着胡须的）演员而且噪音制造也有他一份时，这真是绝妙的讽刺。",
      ai: { backbone: "主语 It、系动词 is、表语 deliciously ironic；when 引导时间状语从句", structure: ["时间状语从句 when you consider that Shakespeare...：修饰主句，说明“讽刺”成立的条件","宾语从句 that Shakespeare...was himself an actor and did his share of noise-making：作 consider 的宾语","非限制性定语从句 who earns their living：修饰 Shakespeare，说明他为镇民带来生计","并列谓语 was himself an actor and did his share of noise-making：强调莎士比亚本人的演员身份与喧闹行为"], collocations: ["earn one's living（谋生）","do one's share of（尽自己的一份……）","deliciously ironic（绝妙地讽刺）"] }}
    ]
  },
  {
    day: 27,
    type: "英一",
    source: "2006 Text 2",
    zh: "旅客流并不是完全分离的。乘公交车过来的观光客经常顺道去参观华威城堡和布伦海姆宫，却通常不会去看戏，有些人甚至很惊讶地发现在斯特拉福德镇居然还有一家剧院。然而，看戏的人则除看戏之外还会设法抽出时间游览一些景点。皇家莎士比亚剧团坚称，正是看戏的人带来了小镇的大部分收入，因为他们在此过夜（有些会住四到五个晚上），将大把的钱花在酒店和餐馆中。而观光者会在夜幕降临前游览完所有地方然后离开小镇。",
    sentences: [
    { num: "①", en: "The tourist streams are not entirely separate.", ref: "旅客流并不是完全分离的。",
      ai: { backbone: "主语 The tourist streams、系动词 are not、表语 entirely separate", structure: ["程度副词 entirely：修饰表语 separate，说明并非完全分离"], collocations: ["tourist streams（游客人流）","not entirely（并非完全）"] }},
    { num: "②", en: "The sightseers who come by bus - and often take in Warwick Castle and Blenheim Palace on the side -- don't usually see the plays, and some of them are even surprised to find a theatre in Stratford.", ref: "乘公交车过来的观光客经常顺道去参观华威城堡和布伦海姆宫，却通常不会去看戏，有些人甚至很惊讶地发现在斯特拉福德镇居然还有一家剧院。",
      ai: { backbone: "主语 The sightseers、谓语 don't see、宾语 the plays；破折号内为插入语", structure: ["定语从句 who come by bus：修饰 sightseers，说明游客的交通方式","插入语 and often take in Warwick Castle and Blenheim Palace on the side：补充说明顺道参观的景点","并列谓语从句 some of them are even surprised to find a theatre：与前句由 and 连接，说明部分游客的意外反应","不定式短语 to find a theatre in Stratford：作 surprised 的补足，说明令其惊讶的内容"], collocations: ["come by bus（乘公交车来）","take in（参观，游览）","on the side（顺带）"] }},
    { num: "③", en: "However, the playgoers do manage a little sight-seeing along with their playgoing.", ref: "然而，看戏的人则除看戏之外还会设法抽出时间游览一些景点。",
      ai: { backbone: "主语 the playgoers、谓语 do manage、宾语 a little sight-seeing", structure: ["副词 However：承上启下，表示转折","并列介词短语 along with their playgoing：说明看戏之外附带观光","强调助动词 do：强调 manage 的动作确实发生"], collocations: ["manage to do sth（设法做到某事）","sight-seeing（观光游览）","along with（连同，与……一起）"] }},
    { num: "④", en: "It is the playgoers, the RSC contends, who bring in much of the town's revenue because they spend the night (some of them four or five nights) pouring cash into the hotels and restaurants.", ref: "皇家莎士比亚剧团坚称，正是看戏的人带来了小镇的大部分收入，因为他们在此过夜（有些会住四到五个晚上），将大把的钱花在酒店和餐馆中。",
      ai: { backbone: "强调句 It is the playgoers...who bring in much of the town's revenue；插入语 the RSC contends", structure: ["强调结构 It is...who...：强调主语 the playgoers，突出带来收益的主体","插入语 the RSC contends：说明该观点的提出者","原因状语从句 because they spend the night pouring cash into the hotels and restaurants：解释带来收益的原因","括号说明 some of them four or five nights：补充留宿时长","现在分词短语 pouring cash into...：作伴随状语，说明花钱的方式"], collocations: ["bring in revenue（带来收入）","pour cash into（向……大量投入金钱）","spend the night（过夜）"] }},
    { num: "⑤", en: "The sightseers can take in everything and get out of town by nightfall.", ref: "而观光者会在夜幕降临前游览完所有地方然后离开小镇。",
      ai: { backbone: "主语 The sightseers、谓语 can take in、宾语 everything；and 连接第二谓语 get out", structure: ["时间状语 by nightfall：说明离开的时间","并列谓语 take in everything and get out of town：说明观光客看完就走的行程"], collocations: ["take in（参观）","get out of town（离开城镇）","by nightfall（到夜幕降临时）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "sightseern.观光者", word: "sightseer", meaning: "n.观光者" },
      { raw: "takein欣赏，参观", word: "takein欣赏，参观", meaning: "" },
      { raw: "ontheside顺道", word: "ontheside顺道", meaning: "" }
    ],
        split: "Thesightseers//whocome//bybus--andoftentakeinWarwickCastleand BlenheimPalace//ontheside--don’tusuallyseetheplays,//andsomeofthemare evensurprised//tofindatheatre//inStratford.",
        grammar: ["主干:主+谓+宾,and主+系+表", "who引导定语从句（限定sightseers）", "第一个and在破折号之后与前一动作并列表示补充说明，双破折号内为插入语", "第二个and并列WarwickCastle和BlenheimPalace", "第三个and并列两个分句"],
        ref: "乘公交车过来的观光客经常顺道去参观华威城堡和布伦海姆宫，却通常不会去看戏，有些人甚至很惊讶地发现在斯特拉福德镇居然还有一家剧院。"
      }
    ]
  },
  {
    day: 28,
    type: "英一",
    source: "2006 Text 2",
    zh: "小镇居民并不这么认为，因而当地市政委员会也不直接出钱补贴皇家莎士比亚剧团。斯特拉特福德镇历来有哭穷的传统。然而镇上的每家旅馆似乎都在增建新的侧厅或酒吧间。希尔顿集团正在那里建造自己的酒店，你几乎可以肯定它会配备哈姆雷特汉堡吧、李尔休息室、班柯宴会包间等，而且会是非常奢华。",
    sentences: [
    { num: "①", en: "The townsfolk don't see it this way and the local council does not contribute directly to the subsidy of the Royal Shakespeare Company.", ref: "小镇居民并不这么认为，因而当地市政委员会也不直接出钱补贴皇家莎士比亚剧团。",
      ai: { backbone: "and 连接两个并列分句：分句1 主语 The townsfolk、谓语 don't see、宾语 it；分句2 主语 the local council、谓语 does not contribute", structure: ["方式状语 this way：修饰 see，说明看待问题的角度","介词短语 to the subsidy of the Royal Shakespeare Company：修饰 contribute，说明不投入的对象"], collocations: ["see it this way（这样看待）","contribute to（为……出资，贡献）","local council（地方议会）"] }},
    { num: "②", en: "Stratford cries poor traditionally.", ref: "斯特拉特福德镇历来有哭穷的传统。",
      ai: { backbone: "主语 Stratford、谓语 cries、补语 poor；副词 traditionally 作状语", structure: ["副词 traditionally：说明这种哭穷是历来如此的传统"], collocations: ["cry poor（哭穷）","traditionally（传统上）"] }},
    { num: "③", en: "Nevertheless every hotel in town seems to be adding a new wing or cocktail lounge.", ref: "然而镇上的每家旅馆似乎都在增建新的侧厅或酒吧间。",
      ai: { backbone: "主语 every hotel in town、谓语 seems to be adding、宾语 a new wing or cocktail lounge", structure: ["状语 Nevertheless：承上启下，表转折","后置定语 in town：修饰 hotel，限定范围","不定式短语 to be adding...：作 seems 的表语，说明持续扩建的动作"], collocations: ["add a new wing（加盖新翼楼）","cocktail lounge（鸡尾酒廊）"] }},
    { num: "④", en: "Hilton is building its own hotel there, which you may be sure will be decorated with Hamlet Hamburger Bars, the Lear Lounge, the Banquo Banqueting Room, and so forth, and will be very expensive.", ref: "希尔顿集团正在那里建造自己的酒店，你几乎可以肯定它会配备哈姆雷特汉堡吧、李尔休息室、班柯宴会包间等，而且会是非常奢华。",
      ai: { backbone: "主语 Hilton、谓语 is building、宾语 its own hotel", structure: ["非限制性定语从句 which...will be decorated with...and will be very expensive：修饰 hotel，说明酒店的装饰与价位","并列谓语 will be decorated with Hamlet Hamburger Bars...：说明内部装修主题","插入语 you may be sure：强调确信无疑的语气"], collocations: ["be decorated with（用……装饰）","and so forth（等等）"] }}
    ],
    analysis: [
      {
        sentNum: "④",
        vocab: [
      { raw: "Hilton希尔顿集团", word: "Hilton希尔顿集团", meaning: "" },
      { raw: "bedecoratedwith用...装饰", word: "bedecoratedwith用...装饰", meaning: "" }
    ],
        split: "Hiltonisbuildingitsownhotelthere,//which(youmaybesure)willbe decoratedwithHamletHamburgerBars,//theLearLounge,//theBanquoBanqueting Room,//andsoforth,//andwillbeveryexpensive.",
        grammar: ["主干:主+谓+宾", "which引导非限制性定语从句", "youmaybesure看作是插入语", "andsoforth为固定搭配表示“等等，诸如此类”", "and在which引导的从句中并列两个分句"],
        ref: "希尔顿集团正在那里建造自己的酒店，你几乎可以肯定它会配备哈姆雷特汉堡吧、李尔休息室、班柯宴会包间等，而且会是非常奢华。"
      }
    ]
  },
  {
    day: 29,
    type: "英一",
    source: "2006 Text 2",
    zh: "无论如何，当地居民都不能理解为什么皇家莎士比亚剧团需要补贴。（剧院连续三年打破上座记录。去年全年，其 1431 个座席的上座率达到 94%，而且今年的情况会更好。）当然，（剧院需要补贴的）原因是成本在飞涨，而票价却一直保持低位。",
    sentences: [
    { num: "①", en: "Anyway, the townsfolk can’t understand why the Royal Shakespeare Company needs a subsidy.", ref: "无论如何，当地居民都不能理解为什么皇家莎士比亚剧团需要补贴。",
      ai: { backbone: "主语 the townsfolk、谓语 can't understand、宾语从句 why the Royal Shakespeare Company needs a subsidy", structure: ["宾语从句 why the RSC needs a subsidy：作 understand 的宾语，说明无法理解的内容"], collocations: ["can't understand why（不明白为什么）","need a subsidy（需要补贴）"] }},
    { num: "②", en: "(The theatre has broken attendance records for three years in a row.", ref: "（剧院连续三年打破上座记录。",
      ai: { backbone: "主语 The theatre、谓语 has broken、宾语 attendance records", structure: ["时间状语 for three years in a row：说明连续三年打破纪录"], collocations: ["break attendance records（打破上座率纪录）","in a row（连续地）"] }},
    { num: "③", en: "Last year its 1,431 seats were 94 per cent occupied all year long and this year they'll do better.)", ref: "去年全年，其 1431 个座席的上座率达到 94%，而且今年的情况会更好。）",
      ai: { backbone: "and 连接两个并列分句：分句1 主语 its 1,431 seats、谓语 were occupied；分句2 主语 they、谓语 will do better", structure: ["时间状语 Last year / all year long：说明全年情况","百分比状语 94 per cent：说明上座率","时间状语 this year：说明今年的预期","宾语 better：作 do 的宾语，表示表现更好"], collocations: ["be occupied（被占用）","do better（做得更好）","all year long（全年）"] }},
    { num: "④", en: "The reason, of course, is that costs have rocketed and ticket prices have stayed low.", ref: "当然，（剧院需要补贴的）原因是成本在飞涨，而票价却一直保持低位。",
      ai: { backbone: "主语 The reason、系动词 is、表语从句 that costs have rocketed and ticket prices have stayed low", structure: ["表语从句 that costs have rocketed and ticket prices have stayed low：作系动词 is 的表语，解释原因","并列分句 costs have rocketed / ticket prices have stayed low：说明成本飞涨而票价维持低位这一矛盾"], collocations: ["rocket（飞涨）","stay low（保持低位）","ticket prices（票价）"] }}
    ]
  },
  {
    day: 30,
    type: "英一",
    source: "2006 Text 2",
    zh: "大幅提价将会是一件令人蒙羞的事，因为这样做将会赶走那些作为“斯特拉福德镇最有吸引力的顾客”的年轻人。他们来这里纯粹是为了欣赏戏剧，而不是为了逛景点。虽然他们来自世界各地，但是看起来却都很相像——身材消瘦，棱角分明，表情专注，穿着牛仔裤和凉鞋，啃着圆面包，躺在剧院外的石板上过夜，等着在上午十点半售票处开门时购买预留给露宿者的 20 张坐票和 80 张站票。",
    sentences: [
    { num: "①", en: "It would be a shame to raise prices too much because it would drive away the young people who are Stratford's most attractive clientele.", ref: "大幅提价将会是一件令人蒙羞的事，因为这样做将会赶走那些作为“斯特拉福德镇最有吸引力的顾客”的年轻人。",
      ai: { backbone: "主语 It、系动词 would be、表语 a shame；不定式短语作真正主语", structure: ["不定式短语 to raise prices too much：作真正主语，说明令人遗憾之事","原因状语从句 because it would drive away the young people：解释为何不该涨价","定语从句 who are Stratford's most attractive clientele：修饰 young people，说明年轻人的重要地位"], collocations: ["it is a shame to（……是件憾事）","raise prices（涨价）","drive away（赶走，使离去）","most attractive clientele（最具吸引力的顾客群）"] }},
    { num: "②", en: "They come entirely for the plays, not the sights.", ref: "他们来这里纯粹是为了欣赏戏剧，而不是为了逛景点。",
      ai: { backbone: "主语 They、谓语 come、介词短语 for the plays 作目的状语", structure: ["目的状语 for the plays：说明前来的目的","否定结构 not the sights：与 for the plays 形成对比，强调只看戏不看景"], collocations: ["come for（为……而来）","the sights（景点）"] }},
    { num: "③", en: "They all seem to look alike (though they come from all over) - lean, pointed, dedicated faces, wearing jeans and sandals, eating their buns and bedding down for the night on the flagstones outside the theatre to buy the 20 seats and 80 standing-room tickets held for the sleepers and sold to them when the box office opens at 10:30 a. m.", ref: "虽然他们来自世界各地，但是看起来却都很相像——身材消瘦，棱角分明，表情专注，穿着牛仔裤和凉鞋，啃着圆面包，躺在剧院外的石板上过夜，等着在上午十点半售票处开门时购买预留给露宿者的 20 张坐票和 80 张站票。",
      ai: { backbone: "主语 They、系动词 seem to look、表语 alike；后接长串同位修饰", structure: ["让步状语从句 though they come from all over：说明虽来自各地却相貌相似","破折号后并列的形容词与分词短语 lean, pointed, dedicated faces, wearing jeans and sandals, eating their buns and bedding down...：作同位语，详细刻画年轻人形象","目的状语 to buy the 20 seats and 80 standing-room tickets：说明过夜的目的","后置定语 held for the sleepers and sold to them：修饰 tickets，说明票的用途","时间状语从句 when the box office opens at 10:30 a.m.：说明售票时间"], collocations: ["look alike（看起来相似）","bed down（露宿，躺下过夜）","standing-room tickets（站票）","box office（售票处）"] }}
    ]
  },
  {
    day: 31,
    type: "英一",
    source: "2006 Text 3",
    zh: "当史前人类到达世界的新区域时，某些奇怪的事情发生在大型动物身上：它们突然灭绝了。体型较小的物种幸存了下来。生长缓慢的大型动物容易被捕获，且迅速被猎杀直至灭绝。现在类似的事情可能正在各大洋中发生。人们多年来早已经知晓海洋正在遭受过度捕捞。而诸如兰森姆，迈尔斯和鲍里斯·沃尔姆这样的研究者所揭示的只是情势恶化到底有多快。他们研究了全世界渔场半个世纪的数据。其研究方法不是试图估算特定海域中鱼类的实际生物量（活体生物的数量），而是（估算）随着时间推移这些生物量的变化。据他们在《自然》杂志上发表的最新论文可知，一个新渔场在开发之初的 15 年中大型食肉鱼类（猎食其他动物的鱼类）的生物量平均减少了 80%。在一些长期捕鱼的地区，生物量自那之后又减少了一半。",
    sentences: [
    { num: "①", en: "When prehistoric man arrived in new parts of the world, something strange happened to the large animals: they suddenly became extinct.", ref: "当史前人类到达世界的新区域时，某些奇怪的事情发生在大型动物身上：它们突然灭绝了。",
      ai: { backbone: "时间状语从句 When prehistoric man arrived...；主句主语 something strange、谓语 happened、状语 to the large animals", structure: ["时间状语从句 When prehistoric man arrived in new parts of the world：修饰主句，说明事件发生的时代与地点","冒号后的独立分句 they suddenly became extinct：对“奇怪的事情”作具体说明","介词短语 to the large animals：说明这种变化的对象"], collocations: ["arrive in（到达）","become extinct（灭绝）"] }},
    { num: "②", en: "Smaller species survived.", ref: "体型较小的物种幸存了下来。",
      ai: { backbone: "主语 Smaller species、谓语 survived", structure: ["该句结构简单，无明显修饰成分"], collocations: ["smaller species（较小的物种）","survive（幸存）"] }},
    { num: "③", en: "The large, slow-growing animals were easy game, and were quickly hunted to extinction.", ref: "生长缓慢的大型动物容易被捕获，且迅速被猎杀直至灭绝。",
      ai: { backbone: "and 连接两个并列分句：分句1 主语 The large, slow-growing animals、系动词 were、表语 easy game；分句2 主语 they、谓语 were hunted", structure: ["并列谓语 were easy game and were quickly hunted to extinction：说明大型动物既易捕猎又迅速被猎尽","介词短语 to extinction：说明猎杀的结果是灭绝"], collocations: ["easy game（易得的猎物，易被利用的对象）","hunt to extinction（猎杀至灭绝）","slow-growing（生长缓慢的）"] }},
    { num: "④", en: "Now something similar could be happening in the oceans.", ref: "现在类似的事情可能正在各大洋中发生。",
      ai: { backbone: "主语 something similar、谓语 could be happening、状语 in the oceans", structure: ["副词 Now：点明当前时间，与史前形成对照","介词短语 in the oceans：说明正在发生的场所"], collocations: ["something similar（类似的情况）","could be happening（可能正在发生）"] }},
    { num: "⑤", en: "That the seas are being overfished has been known for years.", ref: "人们多年来早已经知晓海洋正在遭受过度捕捞。",
      ai: { backbone: "主语从句 That the seas are being overfished、谓语 has been known、时间状语 for years", structure: ["主语从句 That the seas are being overfished：作整个句子的主语，说明长期已知的事实","时间状语 for years：说明这一事实被知晓的时间之长"], collocations: ["be overfished（被过度捕捞）","for years（多年来）"] }},
    { num: "⑥", en: "What researchers such as Ransom Myers and Boris Worm have shown is just how fast things are changing.", ref: "而诸如兰森姆，迈尔斯和鲍里斯·沃尔姆这样的研究者所揭示的只是情势恶化到底有多快。",
      ai: { backbone: "主语从句 What researchers such as Ransom Myers and Boris Worm have shown、谓语 is、表语从句 how fast things are changing", structure: ["主语从句 What researchers...have shown：作句子主语，说明研究对象","介词短语 such as Ransom Myers and Boris Worm：举例说明研究者","表语从句 how fast things are changing：作 is 的表语，说明研究揭示的内容"], collocations: ["such as（例如）","things are changing（情况正在变化）"] }},
    { num: "⑦", en: "They have looked at half a century of data from fisheries around the world.", ref: "他们研究了全世界渔场半个世纪的数据。",
      ai: { backbone: "主语 They、谓语 have looked at、宾语 half a century of data", structure: ["介词短语 from fisheries around the world：作后置定语，修饰 data，说明数据来源"], collocations: ["look at（考察，研究）","half a century of（半个世纪的）","fisheries around the world（世界各地的渔业）"] }},
    { num: "⑧", en: "Their methods do not attempt to estimate the actual biomass (the amount of living biological matter) of fish species in particular parts of the ocean, but rather changes in that biomass over time.", ref: "其研究方法不是试图估算特定海域中鱼类的实际生物量（活体生物的数量），而是（估算）随着时间推移这些生物量的变化。",
      ai: { backbone: "主语 Their methods、谓语 do not attempt to estimate、宾语 the actual biomass；not...but rather 结构连接转折内容", structure: ["括号说明 the amount of living biological matter：解释 biomass 的含义","后置定语 of fish species in particular parts of the ocean：修饰 biomass，限定对象","转折结构 but rather changes in that biomass over time：not...but rather 强调方法不是估算绝对量而是变化量"], collocations: ["attempt to（试图）","actual biomass（实际生物量）","not...but rather（不是……而是……）","over time（随着时间推移）"] }},
    { num: "⑨", en: "According to their latest paper published in Nature, the biomass of large predators (animals that kill and eat other animals) in a new fishery is reduced on average by 80% within 15 years of the start of exploitation.", ref: "据他们在《自然》杂志上发表的最新论文可知，一个新渔场在开发之初的 15 年中大型食肉鱼类（猎食其他动物的鱼类）的生物量平均减少了 80%。",
      ai: { backbone: "主语 the biomass of large predators、谓语 is reduced、状语 by an average of 80%", structure: ["介词短语 According to their latest paper published in Nature：作状语，交代依据","过去分词短语 published in Nature：作后置定语，修饰 paper","括号说明 animals that kill and eat other animals：解释 predators 的含义","介词短语 in a new fishery：说明对象是新渔场","时间状语 within 15 years of the start of exploitation：说明减少发生的时间范围"], collocations: ["on average（平均）","large predators（大型捕食者）","the start of exploitation（开发之初）"] }},
    { num: "⑩", en: "In some long-fished areas, it has halved again since then.", ref: "在一些长期捕鱼的地区，生物量自那之后又减少了一半。",
      ai: { backbone: "主语 it、谓语 has halved；时间状语与地点状语前置", structure: ["时间状语 since then：说明自那以后","地点状语 In some long-fished areas：限定地区","副词 again：表示再度减半"], collocations: ["long-fished areas（长期捕捞的区域）","halve（减半）","since then（自那以后）"] }}
    ]
  },
  {
    day: 32,
    type: "英一",
    source: "2006 Text 3",
    zh: "沃尔姆博士承认这些数据是保守的。其原因之一是捕鱼技术已经改进。当今的船只可以使用50 年前还没有的卫星和声呐技术来寻找猎物。这就意味着更高比例的海洋生物正在被捕获，因此现在和过去之间的真正差异很可能比捕捞量变化所显示出的差异更大。而且，在早期，多钩长线上本可以挂满更多的鱼。有些鱼之所以没有被捕捉，是因为没有可利用的带饵鱼钩来诱捕它们，进而导致过去的鱼类资源量被低估。此外，在使用多钩长线捕鱼的初期，许多鱼被钩住后又被鲨鱼夺走。而现在这不再是一个问题，因为鲨鱼很少出现了。",
    sentences: [
    { num: "①", en: "Dr.Worm acknowledges that these figures are conservative.", ref: "沃尔姆博士承认这些数据是保守的。",
      ai: { backbone: "主语 Dr.Worm、谓语 acknowledges、宾语从句 that these figures are conservative", structure: ["宾语从句 that these figures are conservative：作 acknowledges 的宾语，说明承认的内容"], collocations: ["acknowledge that（承认……）","figures are conservative（数字是保守的）"] }},
    { num: "②", en: "One reason for this is that fishing technology has improved.", ref: "其原因之一是捕鱼技术已经改进。",
      ai: { backbone: "主语 One reason for this、系动词 is、表语从句 that fishing technology has improved", structure: ["表语从句 that fishing technology has improved：作 is 的表语，说明原因","介词短语 for this：作后置定语，修饰 reason"], collocations: ["one reason for（……的一个原因）","fishing technology（捕鱼技术）"] }},
    { num: "③", en: "Today’s vessels can find their prey using satellites and sonar, which were not available 50 years ago.", ref: "当今的船只可以使用50 年前还没有的卫星和声呐技术来寻找猎物。",
      ai: { backbone: "主语 Today's vessels、谓语 can find、宾语 their prey", structure: ["方式状语 using satellites and sonar：说明定位猎物的手段","非限制性定语从句 which were not available 50 years ago：修饰 satellites and sonar，强调技术进步"], collocations: ["find prey（发现猎物）","satellites and sonar（卫星与声呐）","be available（可获得的）"] }},
    { num: "④", en: "That means a higher proportion of what is in the sea is being caught, so the real difference between present and past is likely to be worse than the one recorded by changes in catch sizes.", ref: "这就意味着更高比例的海洋生物正在被捕获，因此现在和过去之间的真正差异很可能比捕捞量变化所显示出的差异更大。",
      ai: { backbone: "主语 That、谓语 means、宾语从句 that a higher proportion of what is in the sea is being caught", structure: ["宾语从句 that a higher proportion of what is in the sea is being caught：作 means 的宾语","介词短语 of what is in the sea：作 proportion 的后置定语，其中 what 引导宾语从句","结果状语从句 so the real difference...is likely to be worse：so 连接结果","比较结构 than the one recorded by changes in catch sizes：与渔获量变化记录的差异比较"], collocations: ["a higher proportion of（更高比例的）","be likely to（很可能）","catch sizes（渔获量）"] }},
    { num: "⑤", en: "In the early days, too, longlines would have been more saturated with fish.", ref: "而且，在早期，多钩长线上本可以挂满更多的鱼。",
      ai: { backbone: "主语 longlines、谓语 would have been、表语 more saturated", structure: ["时间状语 In the early days：说明是早期情况","介词短语 with fish：说明饱和的内容","副词 too：表示同样如此"], collocations: ["in the early days（早期）","be saturated with（充满……，饱和）","longlines（延绳钓）"] }},
    { num: "⑥", en: "Some individuals would therefore not have been caught, since no baited hooks would have been available to trap them, leading to an underestimate of fish stocks in the past.", ref: "有些鱼之所以没有被捕捉，是因为没有可利用的带饵鱼钩来诱捕它们，进而导致过去的鱼类资源量被低估。",
      ai: { backbone: "主语 Some individuals、谓语 would not have been caught；since 引导原因状语从句", structure: ["原因状语从句 since no baited hooks would have been available to trap them：解释为何未被捕获","不定式短语 to trap them：作 hooks 的目的补足","结果状语 now分词短语 leading to an underestimate of fish stocks in the past：说明低估鱼群数量的结果"], collocations: ["baited hooks（带饵的鱼钩）","lead to（导致）","underestimate fish stocks（低估鱼类资源）"] }},
    { num: "⑦", en: "Furthermore, in the early days of longline fishing, a lot of fish were lost to sharks after they had been hooked.", ref: "此外，在使用多钩长线捕鱼的初期，许多鱼被钩住后又被鲨鱼夺走。",
      ai: { backbone: "主语 a lot of fish、谓语 were lost；时间状语从句 after they had been hooked", structure: ["时间状语 In the early days of longline fishing：说明背景","时间状语从句 after they had been hooked：说明损失发生在上钩之后","介词短语 to sharks：说明损失的原因"], collocations: ["be lost to（被……夺走）","longline fishing（延绳钓捕捞）","a lot of（大量）"] }},
    { num: "⑧", en: "That is no longer a problem, because there are fewer sharks around now.", ref: "而现在这不再是一个问题，因为鲨鱼很少出现了。",
      ai: { backbone: "主语 That、系动词 is、表语 no longer a problem；because 引导原因状语从句", structure: ["原因状语从句 because there are fewer sharks around now：解释不再成问题的原因","there be 结构 there are fewer sharks：说明鲨鱼数量减少"], collocations: ["no longer（不再）","fewer...around（周围的……更少）"] }}
    ]
  },
  {
    day: 33,
    type: "英一",
    source: "2006 Text 3",
    zh: "迈尔斯博士和沃尔姆博士认为他们的研究成果将提供一个未来管理活动必须考虑的正确基线。他们认为其数据验证了海洋生物学家就“变化基线”的一种普遍看法。这种看法就是人们未能发觉海洋中发生的巨大变化是因为他们一直只回顾过去一段相对较短时间内的情况。而这事关重大，因为理论认为当目标物种的生物量大约为其原始水平的 50%时，从渔场能够获得最大持续渔获量。大部分渔场都远低于这个水平，这是一种有害的经营方式。",
    sentences: [
    { num: "①", en: "Dr.Myers and Dr.Worm argue that their work gives a correct baseline, which future management efforts must take into account.", ref: "迈尔斯博士和沃尔姆博士认为他们的研究成果将提供一个未来管理活动必须考虑的正确基线。",
      ai: { backbone: "主语 Dr.Myers and Dr.Worm、谓语 argue、宾语从句 that their work gives a correct baseline", structure: ["宾语从句 that their work gives a correct baseline：作 argue 的宾语","非限制性定语从句 which future management efforts must take into account：修饰 baseline，说明其重要性"], collocations: ["argue that（主张……）","a correct baseline（正确的基线）","take into account（考虑，顾及）","future management efforts（未来的管理努力）"] }},
    { num: "②", en: "They believe the data support an idea current among marine biologists, that of the“shifting baseline”.", ref: "他们认为其数据验证了海洋生物学家就“变化基线”的一种普遍看法。",
      ai: { backbone: "主语 They、谓语 believe、宾语从句 the data support an idea", structure: ["宾语从句 the data support an idea...：作 believe 的宾语","后置定语 current among marine biologists：修饰 idea，说明观点在海洋生物学家中的流行","同位语 that of the “shifting baseline”：解释说明 idea 的具体内容"], collocations: ["believe that（相信……）","marine biologists（海洋生物学家）","shifting baseline（动态基线，变动基线）"] }},
    { num: "③", en: "The notion is that people have failed to detect the massive changes which have happened in the ocean because they have been looking back only a relatively short time into the past.", ref: "这种看法就是人们未能发觉海洋中发生的巨大变化是因为他们一直只回顾过去一段相对较短时间内的情况。",
      ai: { backbone: "主语 The notion、系动词 is、表语从句 that people have failed to detect the massive changes", structure: ["表语从句 that people have failed to detect the massive changes：作 is 的表语，解释观点的内涵","定语从句 which have happened in the ocean：修饰 changes，限定变化的发生地","原因状语从句 because they have been looking back only a relatively short time into the past：解释人们为何未能察觉"], collocations: ["fail to do sth（未能做到某事）","look back（回顾）","a relatively short time（相对较短的时间）"] }},
    { num: "④", en: "That matters because theory suggests that the maximum sustainable yield that can be cropped from a fishery comes when the biomass of a target species is about 50% of its original levels.", ref: "而这事关重大，因为理论认为当目标物种的生物量大约为其原始水平的 50%时，从渔场能够获得最大持续渔获量。",
      ai: { backbone: "主语 That、谓语 matters；because 引导原因状语从句", structure: ["原因状语从句 because theory suggests that the maximum sustainable yield...comes when the biomass...is about 50%：解释为何重要","宾语从句 that the maximum sustainable yield...comes...：作 suggests 的宾语","定语从句 that can be cropped from a fishery：修饰 yield，限定捕捞来源","时间状语从句 when the biomass of a target species is about 50% of its original levels：说明产量最大化的条件"], collocations: ["maximum sustainable yield（最大可持续产量）","target species（目标物种）","original levels（原始水平）"] }},
    { num: "⑤", en: "Most fisheries are well below that, which is a bad way to do business.", ref: "大部分渔场都远低于这个水平，这是一种有害的经营方式。",
      ai: { backbone: "主语 Most fisheries、系动词 are、表语 well below that；which 引导非限制性定语从句", structure: ["非限制性定语从句 which is a bad way to do business：指代整个主句，作出评价","不定式短语 to do business：作 way 的后置定语"], collocations: ["well below（远低于）","a bad way to do business（糟糕的经营方式）"] }}
    ],
    analysis: [
      {
        sentNum: "④",
        vocab: [
      { raw: "matterv.要紧，有关系", word: "matter", meaning: "v.要紧，有关系" }
    ],
        split: "Thatmatters//becausetheorysuggests//thatthemaximumsustainableyield //(thatcanbecropped//fromafishery)comes//whenthebiomass//ofatargetspecies isabout50%//ofitsoriginallevels.",
        grammar: ["主干:主+谓", "because引导原因状语从句", "that引导宾语从句（宾语从句内为主谓结构）", "that引导定语从句", "when引导时间状语从句"],
        ref: "而这事关重大，因为理论认为当目标物种的生物量大约为其原始水平的50%时，从渔场能够获得最大持续渔获量。"
      }
    ]
  },
  {
    day: 34,
    type: "英一",
    source: "2006 Text 4",
    zh: "许多事情使人们认为艺术家是怪异的。但最怪异的或许是这件：艺术家唯一的工作就是探究情感，然而他们却选择聚焦于那些令人感觉糟糕的情感。情况并非总是如此。最早期的艺术形式，如绘画和音乐，是最适合表达喜悦的。但大约从19 世纪以来，更多的艺术家开始把幸福看作是无趣的、虚幻的、甚至是使人厌烦的情感，正如我们从华兹华斯的《水仙花》到波德莱尔的《恶之花》所体验到的一样。",
    sentences: [
    { num: "①", en: "Many things make people think artists are weird.", ref: "许多事情使人们认为艺术家是怪异的。",
      ai: { backbone: "主语 Many things、谓语 make、宾语 people、宾补 think artists are weird", structure: ["不定式短语 think artists are weird：作宾语补足语，说明人们对艺术家的印象","宾语从句 artists are weird：作 think 的宾语"], collocations: ["make sb do sth（使某人做某事）","many things（很多事情）"] }},
    { num: "②", en: "But the weirdest may be this: artists’ only job is to explore emotions, and yet they choose to focus on the ones that feel bad.", ref: "但最怪异的或许是这件：艺术家唯一的工作就是探究情感，然而他们却选择聚焦于那些令人感觉糟糕的情感。",
      ai: { backbone: "主语 the weirdest、系动词 may be、表语 this；冒号后为对 this 的解释", structure: ["冒号后的并列分句 artists' only job is to explore emotions, and yet they choose to focus on the ones...：具体说明最怪之处","不定式短语 to explore emotions：作表语，说明艺术家的唯一工作","定语从句 that feel bad：修饰 ones（指 emotions），限定令人不适的情感","连词 and yet：表示转折，突出矛盾"], collocations: ["explore emotions（探索情感）","focus on（专注于）","the ones that feel bad（令人不适的情感）"] }},
    { num: "③", en: "This wasn’t always so.", ref: "情况并非总是如此。",
      ai: { backbone: "主语 This、系动词 wasn't、表语 always so", structure: ["副词 always：说明并非历来如此"], collocations: ["not always（并非总是）"] }},
    { num: "④", en: "The earliest forms of art, like painting and music, are those best suited for expressing joy.", ref: "最早期的艺术形式，如绘画和音乐，是最适合表达喜悦的。",
      ai: { backbone: "主语 The earliest forms of art、系动词 are、表语 those best suited for expressing joy", structure: ["插入语 like painting and music：举例说明艺术形式","后置定语 best suited for expressing joy：修饰 those（指艺术形式），说明其最擅长表达欢乐","介词短语 for expressing joy：修饰 suited，说明适合的对象"], collocations: ["be suited for（适合……）","expressing joy（表达欢乐）","the earliest forms of（最早的形式）"] }},
    { num: "⑤", en: "But somewhere from the 19th century onward, more artists began seeing happiness as meaningless, phony or, worst of all, boring, as we went from Wordsworth’s daffodils to Baudelaire’s flowers of evil.", ref: "但大约从19 世纪以来，更多的艺术家开始把幸福看作是无趣的、虚幻的、甚至是使人厌烦的情感，正如我们从华兹华斯的《水仙花》到波德莱尔的《恶之花》所体验到的一样。",
      ai: { backbone: "主语 more artists、谓语 began seeing、宾语 happiness as meaningless...；as 引出宾语补语", structure: ["时间状语 somewhere from the 19th century onward：说明转折发生的时间起点","介词短语 from Wordsworth's daffodils to Baudelaire's flowers of evil：说明艺术风格的演变轨迹","as 引导的原因状语从句 we went from...to...：解释艺术家观念转变的背景","并列表语 meaningless, phony or, worst of all, boring：说明对幸福的三种负面看法"], collocations: ["from...onward（从……起）","see...as（把……视为）","flowers of evil（恶之花）","worst of all（最糟糕的是）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "somewhereadv.在某处", word: "somewhere", meaning: "adv.在某处" },
      { raw: "onwardadv.向前；从...以后", word: "onward", meaning: "adv.向前；从...以后" },
      { raw: "phonyadj.虚伪的", word: "phony", meaning: "adj.虚伪的" },
      { raw: "daffodil《水仙花》", word: "daffodil《水仙花》", meaning: "" },
      { raw: "flowersofevil《恶之花》", word: "flowersofevil《恶之花》", meaning: "" }
    ],
        split: "Butsomewhere//fromthe19thcenturyonward,//moreartistsbeganseeing happiness//asmeaningless,phonyor,(worstofall),boring,//aswewent//from Wordsworth’sdaffodils//toBaudelaire’sflowersofevil.",
        grammar: ["主干:主+谓+宾+宾补", "seeAasB把A看作B", "fromAtoB从A到B", "第2个as引导方式状语从句"],
        ref: "但大约从19世纪以来，更多的艺术家开始把幸福看作是无趣的、虚幻的、甚至是使人厌烦的情感，正如我们从华兹华斯的《水仙花》到波德莱尔的《恶之花》所体验到的一样。"
      }
    ]
  },
  {
    day: 35,
    type: "英一",
    source: "2006 Text 4",
    zh: "你可能会辩称艺术越来越质疑幸福是因为现代社会经历了如此多的苦难。但早期社会又不是没有经历过连年战乱、天灾人祸和屠杀无辜。事实上，原因可能恰恰相反：当今世界有太多令人作呕的幸福。别忘了，几乎完全致力于描绘幸福的唯一现代表达形式是什么？是广告。反幸福艺术的兴起几乎完全与大众传媒同步，与之相伴而生的还有一种商业文化，在这种文化中幸福不仅是一种理想，更是一种意识形态。",
    sentences: [
    { num: "①", en: "You could argue that art became more skeptical of happiness because modern times have seen so much misery.", ref: "你可能会辩称艺术越来越质疑幸福是因为现代社会经历了如此多的苦难。",
      ai: { backbone: "主语 You、谓语 could argue、宾语从句 that art became more skeptical of happiness", structure: ["宾语从句 that art became more skeptical of happiness：作 argue 的宾语","原因状语从句 because modern times have seen so much misery：解释艺术怀疑幸福的原因"], collocations: ["could argue that（可以说……）","be skeptical of（对……持怀疑态度）","modern times（现代）"] }},
    { num: "②", en: "But it’s not as if earlier times didn’t know perpetual war, disaster and the massacre of innocents.", ref: "但早期社会又不是没有经历过连年战乱、天灾人祸和屠杀无辜。",
      ai: { backbone: "主语 it、系动词 is、表语 not as if earlier times didn't know...", structure: ["表语从句 as if earlier times didn't know perpetual war, disaster and the massacre of innocents：说明早期并非不知苦难","并列宾语 perpetual war, disaster and the massacre of innocents：列举早期人类所知的苦难"], collocations: ["as if（仿佛，好像）","perpetual war（无休止的战争）","the massacre of innocents（屠杀无辜者）"] }},
    { num: "③", en: "The reason, in fact, may be just the opposite: there is too much damn happiness in the world today.", ref: "事实上，原因可能恰恰相反：当今世界有太多令人作呕的幸福。",
      ai: { backbone: "主语 The reason、系动词 may be、表语 the opposite；in fact 作插入语", structure: ["插入语 in fact：加强语气","冒号后的 there is too much damn happiness in the world today：具体说明相反的原因"], collocations: ["the opposite（相反的情况）","in fact（事实上）","too much happiness（过多的幸福）"] }},
    { num: "④", en: "After all, what is the one modern form of expression almost completely dedicated to depicting happiness?", ref: "别忘了，几乎完全致力于描绘幸福的唯一现代表达形式是什么？",
      ai: { backbone: "主语 what is the one modern form of expression almost completely dedicated to depicting happiness？为疑问句，谓语 is", structure: ["后置定语 of expression：修饰 form","过去分词短语 dedicated to depicting happiness：作后置定语，修饰 form，说明其专门用于描绘幸福"], collocations: ["be dedicated to（致力于……）","depict happiness（描绘幸福）","form of expression（表达形式）"] }},
    { num: "⑤", en: "Advertising.", ref: "是广告。",
      ai: { backbone: "单个名词 Advertising 独立成句，承接上文回答问题", structure: ["该句为单词句，直接回答前文疑问，指出答案即广告"], collocations: ["advertising（广告业）"] }},
    { num: "⑥", en: "The rise of anti-happy art almost exactly tracks the emergence of mass media, and with it, a commercial culture in which happiness is not just an ideal but an ideology.", ref: "反幸福艺术的兴起几乎完全与大众传媒同步，与之相伴而生的还有一种商业文化，在这种文化中幸福不仅是一种理想，更是一种意识形态。",
      ai: { backbone: "主语 The rise of anti-happy art、谓语 tracks、宾语 the emergence of mass media", structure: ["状语 The rise of anti-happy art：作主语，其中 of anti-happy art 为后置定语","并列介词短语 and with it, a commercial culture：说明随之而来的商业文化","定语从句 in which happiness is not just an ideal but an ideology：修饰 culture，说明商业文化中幸福的地位"], collocations: ["anti-happy art（反幸福艺术）","mass media（大众传媒）","not just...but（不仅是……而且是……）","commercial culture（商业文化）"] }}
    ]
  },
  {
    day: 36,
    type: "英一",
    source: "2006 Text 4",
    zh: "早期时代的人们被苦难提示信息团团包围。他们工作到筋疲力尽，生活几乎没有任何保障，且年纪尚轻便会逝去。在西方，在大众传播和教育普及之前，最强有力的大众传媒是教堂，在这里，信徒们会被提醒：他们的灵魂处于危险之中，他们有朝一日将沦为腐尸被蠕虫啮噬。鉴于这一切，他们根本不需要艺术也成为一件恼人之物。",
    sentences: [
    { num: "①", en: "People in earlier eras were surrounded by reminders of misery.", ref: "早期时代的人们被苦难提示信息团团包围。",
      ai: { backbone: "主语 People in earlier eras、谓语 were surrounded、介词短语 by reminders of misery 作状语", structure: ["后置定语 in earlier eras：修饰 People，限定时代","介词短语 by reminders of misery：说明被何种事物环绕"], collocations: ["be surrounded by（被……环绕）","in earlier eras（在更早的时代）","reminders of misery（苦难的提醒物）"] }},
    { num: "②", en: "They worked until exhausted, lived with few protections and died young.", ref: "他们工作到筋疲力尽，生活几乎没有任何保障，且年纪尚轻便会逝去。",
      ai: { backbone: "三个并列分句：主语 They、谓语 worked / lived / died", structure: ["并列谓语结构 worked until exhausted, lived with few protections and died young：概述早期民众的艰辛生活","程度状语 until exhausted：说明劳累程度","状语 with few protections：说明缺乏保障","表语 young：说明死得早"], collocations: ["work until exhausted（劳累至精疲力竭）","die young（英年早逝）","few protections（几乎没有保障）"] }},
    { num: "③", en: "In the West, before mass communication and literacy, the most powerful mass medium was the church, which reminded worshippers that their souls were in danger and that they would someday be meat for worms.", ref: "在西方，在大众传播和教育普及之前，最强有力的大众传媒是教堂，在这里，信徒们会被提醒：他们的灵魂处于危险之中，他们有朝一日将沦为腐尸被蠕虫啮噬。",
      ai: { backbone: "主语 the most powerful mass medium、系动词 was、表语 the church", structure: ["时间状语 In the West, before mass communication and literacy：说明背景","非限制性定语从句 which reminded worshippers that...：修饰 church，说明其教诲内容","宾语从句 that their souls were in danger and that they would someday be meat for worms：作 reminded 的宾语，说明告诫的内容"], collocations: ["mass communication（大众传播）","be in danger（处于危险中）","remind sb that（提醒某人……）"] }},
    { num: "④", en: "Given all this, they did not exactly need their art to be a bummer too.", ref: "鉴于这一切，他们根本不需要艺术也成为一件恼人之物。",
      ai: { backbone: "主语 they、谓语 did not exactly need、宾语 their art to be a bummer too", structure: ["状语 Given all this：作原因状语，说明鉴于上述背景","不定式短语 to be a bummer too：作宾语补足语，说明艺术无需同样令人沮丧"], collocations: ["given all this（鉴于这一切）","be a bummer（令人沮丧的事物）","not exactly（并不完全）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "literacyn.读写能力", word: "literacy", meaning: "n.读写能力" },
      { raw: "churchn.教堂", word: "church", meaning: "n.教堂" },
      { raw: "worshippern.崇拜者", word: "worshipper", meaning: "n.崇拜者" },
      { raw: "wormn.蠕虫，寄生虫", word: "worm", meaning: "n.蠕虫，寄生虫" },
      { raw: "masscommunication大众传播", word: "masscommunication大众传播", meaning: "" },
      { raw: "massmedium大众媒体", word: "massmedium大众媒体", meaning: "" }
    ],
        split: "IntheWest,//beforemasscommunicationandliteracy,//themostpowerfulmass mediumwasthechurch,//whichremindedworshippers//thattheirsoulswerein danger//andthattheywouldsomedaybemeatforworms.",
        grammar: ["主干:主+系+表", "结构提炼：Themostpowerfulmassmediumwasthechurch,whichremindedsb.", "thatAandthatB.", "which引导定语从句", "that引导宾语从句", "that引导宾语从句（与前一个宾语从句并列）"],
        ref: "在西方，在大众传播和教育普及之前，最强有力的大众传媒是教堂，在这里，信徒们会被提醒：他们的灵魂处于危险之中，他们有朝一日将沦为腐尸被蠕虫啮噬。"
      }
    ]
  },
  {
    day: 37,
    type: "英一",
    source: "2006 Text 4",
    zh: "如今围绕普通西方人的信息不是宗教的，而是商业的，且永远都是幸福的。快餐食客、新闻主播、发短信者，都在微笑、微笑、微笑。我们的杂志特载满面春光的名人以及完美住宅里的幸福家庭。由于这些信息有着特定的目的——诱使我们打开钱包——它们使得“幸福”这一概念看起来不可靠。“欢庆吧！”关节炎药西乐葆的广告这样鼓动道，之后我们才发现，它会增加心脏病的发病风险。但是我们所忘记的——我们的经济依赖的是我们的忘记——是：幸福并非是没有痛苦的快乐。带来最大欢乐的东西很可能带来最大的损失和失望。如今，周围到处都是对唾手可得的幸福的承诺，我们需要艺术来告诫我们，正如宗教曾经告诉我们，人终有一死，万事皆会结束，幸福不在于否定这一点而在于忍受它。这是甚至比丁香烟还要苦涩的启示，但不知何故，却带来了一缕清新的空气。",
    sentences: [
    { num: "①", en: "Today the messages the average Westerner is surrounded with are not religious but commercial, and forever happy.", ref: "如今围绕普通西方人的信息不是宗教的，而是商业的，且永远都是幸福的。",
      ai: { backbone: "主语 the messages、系动词 are、表语 not religious but commercial, and forever happy；后接定语从句", structure: ["定语从句 the average Westerner is surrounded with：修饰 messages，说明人们周围的信息","并列表语 not religious but commercial and forever happy：not...but 结构说明信息性质","时间状语 Today：点明当下"], collocations: ["be surrounded with（被……包围）","not...but（不是……而是）","forever happy（永远快乐的）"] }},
    { num: "②", en: "Fast-food eaters, news anchors, text messengers, all smiling, smiling, smiling.", ref: "快餐食客、新闻主播、发短信者，都在微笑、微笑、微笑。",
      ai: { backbone: "并列名词短语 Fast-food eaters, news anchors, text messengers 后接现在分词 smiling 作伴随说明", structure: ["现在分词短语 smiling, smiling, smiling：反复出现，强调无处不在的微笑","并列名词短语 Fast-food eaters, news anchors, text messengers：列举各种微笑人群"], collocations: ["fast-food eaters（快餐食客）","news anchors（新闻主播）","text messengers（发短信者）"] }},
    { num: "③", en: "Our magazines feature beaming celebrities and happy families in perfect homes.", ref: "我们的杂志特载满面春光的名人以及完美住宅里的幸福家庭。",
      ai: { backbone: "主语 Our magazines、谓语 feature、宾语 beaming celebrities and happy families", structure: ["后置定语 in perfect homes：修饰 families，说明家庭的完美状态","形容词 beaming：作前置定语，修饰 celebrities，形容笑容满面"], collocations: ["feature（以……为特色，刊登）","beaming celebrities（笑容满面的名人）","happy families（幸福的家庭）"] }},
    { num: "④", en: "And since these messages have an agenda—to lure us to open our wallets—they make the very idea of happiness seem unreliable.", ref: "由于这些信息有着特定的目的——诱使我们打开钱包——它们使得“幸福”这一概念看起来不可靠。",
      ai: { backbone: "主语 these messages、谓语 have、宾语 an agenda；and 连接第二谓语 make", structure: ["原因状语从句 since these messages have an agenda：说明背后的动机","破折号内的不定式短语 to lure us to open our wallets：解释 agenda 的内容","宾语从句 they make the very idea of happiness seem unreliable：说明结果，其中 make 后接宾语+宾补"], collocations: ["have an agenda（别有用心，有计划）","lure sb to do（诱使某人做）","open one's wallet（掏钱包）","seem unreliable（显得不可靠）"] }},
    { num: "⑤", en: "“Celebrate!”", ref: "“欢庆吧！”",
      ai: { backbone: "独立引语 “Celebrate!” 为祈使句，谓语 Celebrate", structure: ["该句为祈使句，表达号召性口号，无主语"], collocations: ["celebrate（庆祝）"] }},
    { num: "⑥", en: "commanded the ads for the arthritis drug Celebrex, before we found out it could increase the risk of heart attacks.", ref: "关节炎药西乐葆的广告这样鼓动道，之后我们才发现，它会增加心脏病的发病风险。",
      ai: { backbone: "引语 commanded the ads...为倒装引述句，主语 the ads、谓语 commanded；before 引导时间状语从句", structure: ["宾语前置 Celebrated 与引语“Celebrate!”呼应","后置定语 for the arthritis drug Celebrex：修饰 the ads，说明广告针对的药物","时间状语从句 before we found out it could increase the risk of heart attacks：说明后来才发现的真相","宾语从句 it could increase the risk of heart attacks：作 found out 的宾语"], collocations: ["command（命令，号召）","arthritis drug（关节炎药物）","increase the risk of（增加……的风险）","heart attacks（心脏病发作）"] }},
    { num: "⑦", en: "But what we forget—what our economy depends on us forgetting—is that happiness is more than pleasure without pain.", ref: "但是我们所忘记的——我们的经济依赖的是我们的忘记——是：幸福并非是没有痛苦的快乐。",
      ai: { backbone: "主语 what we forget、谓语 is、表语从句 that happiness is more than pleasure without pain", structure: ["主语从句 what we forget：作主语","破折号内的宾语从句 what our economy depends on us forgetting：作主语从句的补充说明","表语从句 that happiness is more than pleasure without pain：作 is 的表语，阐明观点"], collocations: ["depend on（依赖）","more than（不仅仅是）","pleasure without pain（没有痛苦的快乐）"] }},
    { num: "⑧", en: "The things that bring the greatest joy carry the greatest potential for loss and disappointment.", ref: "带来最大欢乐的东西很可能带来最大的损失和失望。",
      ai: { backbone: "主语 The things、谓语 carry、宾语 the greatest potential", structure: ["定语从句 that bring the greatest joy：修饰 things，说明带来最大快乐的事物","介词短语 for loss and disappointment：作后置定语，修饰 potential，说明潜在的对象"], collocations: ["bring joy（带来快乐）","potential for loss（失去的可能）","disappointment（失望）"] }},
    { num: "⑨", en: "Today, surrounded by promises of easy happiness, we need art to tell us, as religion once did, Memento mori: remember that you will die, that everything ends, and that happiness comes not in denying this but in living with it.", ref: "如今，周围到处都是对唾手可得的幸福的承诺，我们需要艺术来告诫我们，正如宗教曾经告诉我们，人终有一死，万事皆会结束，幸福不在于否定这一点而在于忍受它。",
      ai: { backbone: "主语 we、谓语 need、宾语 art、宾补 to tell us；句首为过去分词状语", structure: ["过去分词短语 surrounded by promises of easy happiness：作状语，说明人们所处的环境","方式状语 as religion once did：说明艺术像宗教那样告诫","宾语补足语 to tell us Memento mori...：说明艺术要传达的内容","宾语从句 remember that you will die, that everything ends, and that happiness comes...：作 remember 的三个并列宾语，阐释死亡与幸福的真谛"], collocations: ["be surrounded by（被……包围）","promises of easy happiness（唾手可得的幸福的承诺）","Memento mori（记住你终将死亡）","deny（否认，拒绝承认）"] }},
    { num: "⑩", en: "It’s a message even more bitter than a clove cigarette, yet, somehow, a breath of fresh air.", ref: "这是甚至比丁香烟还要苦涩的启示，但不知何故，却带来了一缕清新的空气。",
      ai: { backbone: "主语 It、系动词 is、表语 a message；yet 连接第二层转折", structure: ["比较结构 even more bitter than a clove cigarette：说明信息的苦涩程度","转折副词 somehow：表示某种出人意料的意味","表语 a breath of fresh air：说明虽苦涩却清新","并列连词 yet：连接前后两个表语性质"], collocations: ["a clove cigarette（丁香香烟）","a breath of fresh air（一股清新的空气）","even more bitter（更加苦涩）"] }}
    ],
    analysis: [
      {
        sentNum: "⑦",
        vocab: [
      { raw: "dependon依赖于/取决于", word: "dependon依赖于/取决于", meaning: "" },
      { raw: "morethan极其；超过；不仅仅", word: "morethan极其；超过；不仅仅", meaning: "" }
    ],
        split: "Butwhatweforget//—whatoureconomydependsonusforgetting—//isthat happinessismorethanpleasure//withoutpain.",
        grammar: ["主干:主从+系+表从", "morethan不仅仅", "without...作后置定语"],
        ref: "但是我们所忘记的—我们的经济依赖的是我们的忘记—是：幸福并非是没有痛苦的快乐。"
      },
      {
        sentNum: "⑨",
        vocab: [
      { raw: "religionn.宗教", word: "religion", meaning: "n.宗教" },
      { raw: "denyv.否认", word: "deny", meaning: "v.否认" },
      { raw: "livewith忍受", word: "livewith忍受", meaning: "" },
      { raw: "not...but...不是...而是...", word: "not...but...不是...而是...", meaning: "" }
    ],
        split: "Today,//surroundedbypromises//ofeasyhappiness,//weneedart//totellus,//as religiononcedid,//Mementomori:remember//thatyouwilldie,//thateverything ends,//andthathappinesscomes//notindenyingthis//butinlivingwithit.",
        grammar: ["主干:主+谓+宾", "并列结构提炼：rememberthatA,thatBandthatC", "surroundedby...过去分词短语作伴随状语", "asreligiononcedid是插入语，表示“正如...那样”", "notin...butin...“不在于...而在于...”介词短语作状语", "补充：Mementomori记忆死亡：一种艺术形式，通过描绘死亡的符号或图像，", "以提醒人们生命的短暂和必然的死亡。"],
        ref: "如今，周围到处都是对唾手可得的幸福的承诺，我们需要艺术来告诫我们，正如宗教曾经告诉我们，人终有一死，万事皆会结束，幸福不在于否定这一点而在于忍受它。"
      }
    ]
  },
  {
    day: 38,
    type: "英一",
    source: "2007 Text 1",
    zh: "如果查看一下 2006 年世界杯赛所有足球运动员的出生证，你很可能会发现一件引人注意的奇事：出类拔萃的足球运动员更可能出生在一年中的头几个月而非后几个月。如果再看看为世界杯和职业球队输送人才的欧洲各国国家青年队（队员出生证），你会发现这一奇怪现象甚至更为显著。这一奇怪现象可能的成因是什么呢？以下是几种猜测：a）某些星座赐予球员高超的足球技能；b）冬季出生的婴孩往往具有更高的血液携氧能力，这会增加踢足球时的耐力；c）痴速足球的父母更可能在春天，也即每年足球狂热的巅峰时期受孕；d）以上都不是。",
    sentences: [
    { num: "①", en: "If you were to examine the birth certificates of every soccer player in 2006’s World Cup tournament, you would most likely find a noteworthy quirk: elite soccer players are more likely to have been born in the earlier months of the year than in the late months.", ref: "如果查看一下 2006 年世界杯赛所有足球运动员的出生证，你很可能会发现一件引人注意的奇事：出类拔萃的足球运动员更可能出生在一年中的头几个月而非后几个月。",
      ai: { backbone: "主句主语 you、谓语 would find、宾语 a noteworthy quirk；句首为 if 引导的条件状语从句", structure: ["条件状语从句 If you were to examine the birth certificates of every soccer player...：虚拟语气，说明假设条件","时间状语 in 2006's World Cup tournament：限定对象","冒号后的独立分句 elite soccer players are more likely to have been born in the earlier months...：具体解释 quirk 的内容","比较结构 more likely...than in the late months：对比出生月份"], collocations: ["birth certificates（出生证明）","World Cup tournament（世界杯锦标赛）","be likely to（很可能）","a noteworthy quirk（值得注意的怪现象）"] }},
    { num: "②", en: "If you then examined the European national youth teams that feed the World Cup and professional ranks, you would find this strange phenomenon to be ever more pronounced.", ref: "如果再看看为世界杯和职业球队输送人才的欧洲各国国家青年队（队员出生证），你会发现这一奇怪现象甚至更为显著。",
      ai: { backbone: "主句主语 you、谓语 would find、宾语 this strange phenomenon；句首为 if 条件状语从句", structure: ["条件状语从句 If you then examined the European national youth teams：虚拟条件","定语从句 that feed the World Cup and professional ranks：修饰 teams，说明其作用","宾语补足语 to be ever more pronounced：说明现象更显著"], collocations: ["national youth teams（国家青年队）","professional ranks（职业行列）","ever more pronounced（更加明显）"] }},
    { num: "③", en: "What might account for this strange phenomenon?", ref: "这一奇怪现象可能的成因是什么呢？",
      ai: { backbone: "疑问句：主语 What、谓语 might account for、宾语 this strange phenomenon", structure: ["情态动词 might：表示可能性的推测","介词短语 for this strange phenomenon：说明针对的对象"], collocations: ["account for（解释，说明）","strange phenomenon（奇怪的现象）"] }},
    { num: "④", en: "Here are a few guesses: a) certain astrological signs confer superior soccer skills; b) winter-born babies tend to have higher oxygen capacity, which increases soccer stamina; c) soccer-mad parents are more likely to conceive children in springtime, at the annual peak of soccer mania; d) none of the above.", ref: "以下是几种猜测：a）某些星座赐予球员高超的足球技能；b）冬季出生的婴孩往往具有更高的血液携氧能力，这会增加踢足球时的耐力；c）痴速足球的父母更可能在春天，也即每年足球狂热的巅峰时期受孕；d）以上都不是。",
      ai: { backbone: "主语 Here、系动词 are、表语 a few guesses；冒号后列举四种猜测", structure: ["并列列举 a) certain astrological signs confer superior soccer skills；b) winter-born babies tend to have higher oxygen capacity...；c) soccer-mad parents are more likely to conceive children...；d) none of the above：四种猜测以分号并列","定语从句 which increases soccer stamina：修饰 oxygen capacity","介词短语 at the annual peak of soccer mania：说明受孕的时间"], collocations: ["astrological signs（星座）","oxygen capacity（氧容量）","conceive children（受孕）","the peak of（……的高峰）"] }}
    ]
  },
  {
    day: 39,
    type: "英一",
    source: "2007 Text 1",
    zh: "安德斯·艾利克森，佛罗里达州立大学一位 58 岁的心理学教授，称他坚信“以上都不对”。艾利克森在瑞典长大，起初攻读核能工程学，直到他意识到如果转学心理学，会有更多机会从事自己的研究。他的首次实验，大约在 30 年前，与记忆力相关：训练一个人听一组随机数字，随后进行复述。“在约 20 个小时训练之后，第一位被试者的数字记忆跨度从 7 个增加至 20 个，”艾利克森回忆道，“他不断地进步，约 200 个小时训练之后，他能记住 80 多个数字。”",
    sentences: [
    { num: "①", en: "Anders Ericsson, a 58-year-old psychology professor at Florida State University, says he believes strongly in “none of the above.”", ref: "安德斯·艾利克森，佛罗里达州立大学一位 58 岁的心理学教授，称他坚信“以上都不对”。",
      ai: { backbone: "主语 Anders Ericsson、谓语 says、宾语从句 he believes strongly in “none of the above”", structure: ["同位语 a 58-year-old psychology professor at Florida State University：说明 Ericsson 的身份","宾语从句 he believes strongly in “none of the above”：作 says 的宾语"], collocations: ["psychology professor（心理学教授）","believe strongly in（坚信）","none of the above（以上都不是）"] }},
    { num: "②", en: "Ericsson grew up in Sweden, and studied nuclear engineering until he realized he would have more opportunity to conduct his own research if he switched to psychology.", ref: "艾利克森在瑞典长大，起初攻读核能工程学，直到他意识到如果转学心理学，会有更多机会从事自己的研究。",
      ai: { backbone: "主语 Ericsson、谓语 grew up；and 连接第二谓语 studied；until 引导时间状语从句", structure: ["地点状语 in Sweden：说明成长地","时间状语从句 until he realized he would have more opportunity...：说明转变的时间点","宾语从句 he would have more opportunity to conduct his own research if he switched to psychology：作 realized 的宾语","条件状语从句 if he switched to psychology：说明机会的条件"], collocations: ["grow up（长大）","nuclear engineering（核工程）","switch to（转向）","conduct research（开展研究）"] }},
    { num: "③", en: "His first experiment, nearly 30 years ago, involved memory: training a person to hear and then repeat a random series of numbers.", ref: "他的首次实验，大约在 30 年前，与记忆力相关：训练一个人听一组随机数字，随后进行复述。",
      ai: { backbone: "主语 His first experiment、谓语 involved、宾语 memory；冒号后为解释说明", structure: ["时间状语 nearly 30 years ago：说明实验时间","现在分词短语 training a person to hear and then repeat a random series of numbers：具体解释实验内容","不定式短语 to hear and then repeat...：作训练的内容"], collocations: ["first experiment（第一次实验）","a random series of（一系列随机的）","involve（涉及，包含）"] }},
    { num: "④", en: "“With the first subject, after about 20 hours of training, his digit span had risen from 7 to 20,” Ericsson recalls. “He kept improving, and after about 200 hours of training he had risen to over 80 numbers.”", ref: "“在约 20 个小时训练之后，第一位被试者的数字记忆跨度从 7 个增加至 20 个，”艾利克森回忆道，“他不断地进步，约 200 个小时训练之后，他能记住 80 多个数字。”",
      ai: { backbone: "引语 “With the first subject... had risen from 7 to 20” 作宾语，主语 Ericsson、谓语 recalls", structure: ["引语中主语 his digit span、谓语 had risen：说明数字广度的提升","时间状语 after about 20 hours of training：说明训练时长","后一句引语 He kept improving...：补充说明持续进步","时间状语 after about 200 hours of training：说明更长的训练时间","介词短语 to over 80 numbers：说明最终水平"], collocations: ["digit span（数字广度，数字记忆跨度）","rise from...to...（从……上升到……）","keep improving（持续进步）"] }}
    ]
  },
  {
    day: 40,
    type: "英一",
    source: "2007 Text 1",
    zh: "这次成功，加上后续的表明记忆力本身并非由基因决定的研究，使得艾利克森得出结论：记忆行为与其说是一种直觉活动，不如说是一种认知活动。换句话说，不论两个人在记忆能力方面表现出什么先天性差异，这些差异都被个人“编码”信息能力的强弱所掩盖。艾利克森断定，学习有目的地编码信息的最佳方法是一个被称为“刻意练习”的过程。“刻意练习”需要的不仅仅是简单地重复任务，确切地讲，它需要制定明确目标、获取即时反馈并且要技巧与结果并重。",
    sentences: [
    { num: "①", en: "This success, coupled with later research showing that memory itself is not genetically determined, led Ericsson to conclude that the act of memorizing is more of a cognitive exercise than an intuitive one.", ref: "这次成功，加上后续的表明记忆力本身并非由基因决定的研究，使得艾利克森得出结论：记忆行为与其说是一种直觉活动，不如说是一种认知活动。",
      ai: { backbone: "主语 This success、谓语 led、宾语 Ericsson、宾补 to conclude；句首为过去分词短语作状语", structure: ["过去分词短语 coupled with later research：作后置定语，修饰 success","现在分词短语 showing that memory itself is not genetically determined：作后置定语，修饰 research","宾语从句 that memory itself is not genetically determined：作 showing 的宾语","宾语补足语 to conclude that the act of memorizing is more of a cognitive exercise than an intuitive one：说明结论","比较结构 more...than...：对比认知练习与直觉行为"], collocations: ["coupled with（加上，与……结合）","genetically determined（由基因决定的）","lead sb to conclude（使某人得出结论）","more...than（与其……不如……）"] }},
    { num: "②", en: "In other words, whatever inborn differences two people may exhibit in their abilities to memorize, those differences are swamped by how well each person “encodes” the information.", ref: "换句话说，不论两个人在记忆能力方面表现出什么先天性差异，这些差异都被个人“编码”信息能力的强弱所掩盖。",
      ai: { backbone: "主语 those differences、谓语 are swamped；句首为让步状语从句", structure: ["让步状语从句 whatever inborn differences two people may exhibit in their abilities to memorize：无论先天差异如何","方式状语 by how well each person “encodes” the information：说明被何淹没","介词短语 in their abilities to memorize：修饰 differences，限定领域"], collocations: ["inborn differences（先天差异）","be swamped by（被……淹没）","encode information（编码信息）"] }},
    { num: "③", en: "And the best way to learn how to encode information meaningfully, Ericsson determined, was a process known as deliberate practice.", ref: "艾利克森断定，学习有目的地编码信息的最佳方法是一个被称为“刻意练习”的过程。",
      ai: { backbone: "主语 the best way、系动词 was、表语 a process；and 连接第二主语", structure: ["不定式短语 to learn how to encode information meaningfully：作 way 的后置定语","插入语 Ericsson determined：说明观点来源","过去分词短语 known as deliberate practice：作后置定语，修饰 process，说明其名称"], collocations: ["deliberate practice（刻意练习）","encode information（编码信息）","the best way to（……的最佳方式）"] }},
    { num: "④", en: "Deliberate practice entails more than simply repeating a task. Rather, it involves setting specific goals, obtaining immediate feedback and concentrating as much on technique as on outcome.", ref: "“刻意练习”需要的不仅仅是简单地重复任务，确切地讲，它需要制定明确目标、获取即时反馈并且要技巧与结果并重。",
      ai: { backbone: "主语 Deliberate practice、谓语 entails、宾语 more than simply repeating a task；Rather 引出第二分句", structure: ["宾语结构 more than simply repeating a task：说明刻意练习不止于此","第二分句 it involves setting specific goals, obtaining immediate feedback and concentrating...：说明其具体要素","并列动名词短语 setting...obtaining...concentrating...：列举刻意练习的三个要素","比较结构 as much on technique as on outcome：强调技巧与结果并重"], collocations: ["deliberate practice（刻意练习）","entail（需要，牵涉）","set specific goals（设定具体目标）","immediate feedback（即时反馈）","concentrate on（专注于）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "cognitiveadj.认知的", word: "cognitive", meaning: "adj.认知的" },
      { raw: "intuitiveadj.直觉的", word: "intuitive", meaning: "adj.直觉的" }
    ],
        split: "Thissuccess,//coupledwithlaterresearch//showing//thatmemoryitselfisnot geneticallydetermined,//ledEricssontoconclude//thattheactofmemorizingis moreofacognitiveexercise//thananintuitiveone.",
        grammar: ["主干：主+谓+宾+宾补", "主干结构提炼：ThissuccessledEricssontoconcludethat...", "showingthat...作后置定语", "两个that都引导宾语从句", "coupledwith加上/连同/并且", "moreAthanB与其说B不如说A（肯A否B）"],
        ref: "这次成功，加上后续的研究表明：记忆力本身并非由基因决定，这些使得艾利克森得出结论：记忆行为与其说是一种直觉活动，不如说是一种认知活动。"
      }
    ]
  },
  {
    day: 41,
    type: "英一",
    source: "2007 Text 1",
    zh: "艾利克森和他的同事由此开始 于研究众多领域（包括足球）的出色表现者。他们收集能够收集到的所有资料，不仅包括工作表现统计数据和生平详细资料，还包括他们在自己实验室里对杰出人才所做实验的结果。他们的研究结论相当令人震惊：我们通常称之为“天赋”的这一特质被过于高估了。或者，换句话说，不管是在记忆力还是外科手术领域，是在芭蕾舞还是在计算机编程方面，表现出色的人几乎都是造就的，而不是天生的。",
    sentences: [
    { num: "①", en: "Ericsson and his colleagues have thus taken to studying expert performers in a wide range of pursuits, including soccer.", ref: "艾利克森和他的同事由此开始 于研究众多领域（包括足球）的出色表现者。",
      ai: { backbone: "主语 Ericsson and his colleagues、谓语 have taken to studying、宾语 expert performers", structure: ["时间状语 thus：表因果关系","现在分词短语 studying expert performers in a wide range of pursuits：作 take to 的宾语","介词短语 in a wide range of pursuits：限定领域范围","介词短语 including soccer：举例说明"], collocations: ["take to doing（开始从事）","expert performers（顶尖表现者）","a wide range of（广泛的）","pursuits（追求的事业）"] }},
    { num: "②", en: "They gather all the data they can, not just performance statistics and biographical details but also the results of their own laboratory experiments with high achievers.", ref: "他们收集能够收集到的所有资料，不仅包括工作表现统计数据和生平详细资料，还包括他们在自己实验室里对杰出人才所做实验的结果。",
      ai: { backbone: "主语 They、谓语 gather、宾语 all the data；后接 not just...but also 结构", structure: ["定语从句 they can：省略 that，修饰 data","并列结构 not just performance statistics and biographical details but also the results...：强调收集数据的全面","后置定语 with high achievers：修饰 experiments，说明实验对象"], collocations: ["gather data（收集数据）","performance statistics（成绩统计）","biographical details（生平细节）","laboratory experiments（实验室实验）","high achievers（高成就者）"] }},
    { num: "③", en: "Their work makes a rather startling assertion: the trait we commonly call talent is highly overrated.", ref: "他们的研究结论相当令人震惊：我们通常称之为“天赋”的这一特质被过于高估了。",
      ai: { backbone: "主语 Their work、谓语 makes、宾语 a rather startling assertion；冒号后为解释", structure: ["冒号后的独立分句 the trait we commonly call talent is highly overrated：具体说明断言内容","定语从句 we commonly call talent：修饰 trait，省略 that","程度副词 highly：修饰 overrated"], collocations: ["make an assertion（作出断言）","startling（令人震惊的）","be overrated（被高估）"] }},
    { num: "④", en: "Or, put another way, expert performers—whether in memory or surgery, ballet or computer programming—are nearly always made, not born.", ref: "或者，换句话说，不管是在记忆力还是外科手术领域，是在芭蕾舞还是在计算机编程方面，表现出色的人几乎都是造就的，而不是天生的。",
      ai: { backbone: "主语 expert performers、系动词 are、表语 made, not born；句首为插入状语", structure: ["插入语 put another way：换种说法","介词短语 whether in memory or surgery, ballet or computer programming：列举不同领域","并列结构 made, not born：强调后天造就而非天生","副词 nearly always：说明几乎总是如此"], collocations: ["put another way（换句话说）","expert performers（顶尖表现者）","be made, not born（是后天造就而非天生的）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "gatherv.收集", word: "gather", meaning: "v.收集" },
      { raw: "biographicaladj.传记的，关于某人生平的", word: "biographical", meaning: "adj.传记的，关于某人生平的" },
      { raw: "highachieversn.表现优异者", word: "highachievers", meaning: "n.表现优异者" }
    ],
        split: "Theygatherallthedata//(that)theycan(gather),//notjustperformancestatistics andbiographicaldetails//butalsotheresults//oftheirownlaboratoryexperiments //withhighachievers.",
        grammar: ["主干：主+谓+宾", "theycan的完整表达为thattheycangather，出于简洁的考虑省掉了that和gather", "notjust...butalso...并列结构是data的同位语"],
        ref: "他们收集能够收集到的所有资料，(这些资料)不仅包括工作表现统计数据和生平详细资料，还包括他们在自己实验室里对杰出人才所做实验的结果。"
      }
    ]
  },
  {
    day: 42,
    type: "英一",
    source: "2007 Text 2",
    zh: "在过去几年中，报纸周日副刊《大观》开设了一版名为“问问玛丽莲”的特色专栏。人们被邀请向玛丽莲·沃斯·莎凡提问，她在 10 岁时测得的智力水平相当于普通人 23 岁左右；这使她的智商达到 228——这是有记录以来的最高分数。IQ 测试要求你完成文字和视觉类推、想象纸张经折叠和剪切后的形状、推导数字序列，以及其他类似的任务。因此，莎凡能巧妙应对（智商为 100 的）普通人提出的诸如“爱与喜爱有何区别”或“运气和巧合的本质是什么”这类问题,这有点令人费解。想象物体（形状）和破解数值模式的能力如何能使人解答那些曾难倒一些最优秀诗人和哲学家的问题，这一点难以理解。显然，智力不止包含一次测试的一个得分。那么什么才叫“聪明”呢？智力有多少可以被明确（测知）？我们从神经学、遗传学、计算机科学和其他领域中又能对智力了解多少呢?",
    sentences: [
    { num: "①", en: "For the past\u0003several years, the Sunday newspaper supplement Parade has featured a column called “Ask Marilyn.”", ref: "在过去几年中，报纸周日副刊《大观》开设了一版名为“问问玛丽莲”的特色专栏。",
      ai: { backbone: "主语 the Sunday newspaper supplement Parade、谓语 has featured、宾语 a column called “Ask Marilyn”", structure: ["时间状语 For the past several years：说明持续时间","过去分词短语 called “Ask Marilyn”：作后置定语，修饰 column"], collocations: ["newspaper supplement（报纸副刊）","feature a column（刊登专栏）"] }},
    { num: "②", en: "People are invited to query Marilyn vos Savant, who at age 10 had tested at a mental level of someone about 23 years old;", ref: "人们被邀请向玛丽莲·沃斯·莎凡提问，她在 10 岁时测得的智力水平相当于普通人 23 岁左右；",
      ai: { backbone: "主句主语 People、谓语 are invited；后接 to query 不定式", structure: ["不定式短语 to query Marilyn vos Savant：作主语补足语，说明受邀做的事","非限制性定语从句 who at age 10 had tested at a mental level of someone about 23 years old：修饰 vos Savant，说明其早年智力水平"], collocations: ["be invited to（被邀请……）","mental level（智力水平）"] }},
    { num: "③", en: "that gave her an IQ of 228—the highest score ever recorded.", ref: "这使她的智商达到 228——这是有记录以来的最高分数。",
      ai: { backbone: "主语 that、谓语 gave、宾语 her、宾语补语 an IQ of 228；破折号后为解释", structure: ["破折号后的 the highest score ever recorded：作 IQ of 228 的同位语，强调其纪录性"], collocations: ["give an IQ of（智商达到）","the highest score ever recorded（有记录以来的最高分）"] }},
    { num: "④", en: "IQ tests ask you to complete verbal and visual analogies, to envision paper after it has been folded and cut, and to deduce numerical sequences, among other similar tasks.", ref: "IQ 测试要求你完成文字和视觉类推、想象纸张经折叠和剪切后的形状、推导数字序列，以及其他类似的任务。",
      ai: { backbone: "主语 IQ tests、谓语 ask、宾语 you、宾补 to complete...to envision...and to deduce...", structure: ["并列不定式短语 to complete verbal and visual analogies, to envision paper...and to deduce numerical sequences：作宾语补足语，列举测试任务","时间状语 after it has been folded and cut：说明折剪后的纸","介词短语 among other similar tasks：说明还有其他类似任务"], collocations: ["verbal and visual analogies（语言与视觉类比）","numerical sequences（数字序列）","IQ tests（智商测试）"] }},
    { num: "⑤", en: "So it is a bit confusing when vos Savant fields such queries from the average Joe (whose IQ is 100) as, What’s the difference between love and fondness? Or what is the nature of luck and coincidence?", ref: "因此，莎凡能巧妙应对（智商为 100 的）普通人提出的诸如“爱与喜爱有何区别”或“运气和巧合的本质是什么”这类问题,这有点令人费解。",
      ai: { backbone: "主语 it、系动词 is、表语 a bit confusing；so 连接因果；when 引导时间状语从句", structure: ["时间状语从句 when vos Savant fields such queries from the average Joe：说明令人困惑的场景","后置定语 whose IQ is 100：修饰 the average Joe","宾语从句 what's the difference between love and fondness？or what is the nature of luck and coincidence？：作引述的两个并列问题"], collocations: ["field queries（应答提问）","the average Joe（普通人）","the nature of（……的本质）"] }},
    { num: "⑥", en: "It’s not obvious how the capacity to visualize objects and to figure out numerical patterns suits one to answer questions that have eluded some of the best poets and philosophers.", ref: "想象物体（形状）和破解数值模式的能力如何能使人解答那些曾难倒一些最优秀诗人和哲学家的问题，这一点难以理解。",
      ai: { backbone: "主语 it、系动词 is not、表语 obvious；不定式短语作真正主语", structure: ["不定式短语 how the capacity...suits one to answer questions：作真正主语，说明不明确之处","并列不定式 to visualize objects and to figure out numerical patterns：说明能力内容","定语从句 that have eluded some of the best poets and philosophers：修饰 questions，说明难题之难"], collocations: ["visualize objects（想象物体）","figure out（弄明白）","elude（使……困惑，难倒）"] }},
    { num: "⑦", en: "Clearly, intelligence encompasses more than a score on a test.", ref: "显然，智力不止包含一次测试的一个得分。",
      ai: { backbone: "主语 intelligence、谓语 encompasses、宾语 more than a score on a test", structure: ["副词 Clearly：加强语气","比较结构 more than a score on a test：说明智力远不止分数"], collocations: ["encompass（包含，涵盖）","more than（不仅仅是）"] }},
    { num: "⑧", en: "Just what does it mean to be smart?", ref: "那么什么才叫“聪明”呢？",
      ai: { backbone: "疑问句：主语 it、谓语 does mean、宾语 what；to be smart 为不定式主语", structure: ["强调助动词 does：加强疑问语气","不定式短语 to be smart：作真正主语"], collocations: ["just what does it mean to（究竟意味着什么）","be smart（聪明）"] }},
    { num: "⑨", en: "How much of intelligence can be specified, and how much can we learn about it from neurology, genetics, computer science and other fields?", ref: "智力有多少可以被明确（测知）？我们从神经学、遗传学、计算机科学和其他领域中又能对智力了解多少呢?",
      ai: { backbone: "疑问句：主语 how much of intelligence、谓语 can be specified；and 连接第二分句", structure: ["第二分句 how much can we learn about it from neurology, genetics, computer science and other fields：提出另一问","介词短语 from neurology...：说明知识来源领域"], collocations: ["be specified（被明确说明）","neurology（神经学）","genetics（遗传学）"] }}
    ],
    analysis: [
      {
        sentNum: "⑥",
        vocab: [
      { raw: "visualizev.想象", word: "visualize", meaning: "v.想象" },
      { raw: "eludev.难倒", word: "elude", meaning: "v.难倒" },
      { raw: "philosophern.哲学家", word: "philosopher", meaning: "n.哲学家" },
      { raw: "suitv.适合/满足某人...需求", word: "suit", meaning: "v.适合/满足某人...需求" },
      { raw: "figureout算出，弄明白", word: "figureout算出，弄明白", meaning: "" }
    ],
        split: "It’snotobvious//howthecapacity//(tovisualizeobjects//andtofigureout numericalpatterns)suitsone//toanswerquestions//thathaveeludedsomeofthebest poetsandphilosophers.",
        grammar: ["主干：主+系+表（形式主语+系+表+主语从句）", "主干结构提炼：Itisnotobvioushowthecapacitysuitsonetodosth.", "主语从句主干结构：主+谓+宾+宾补thecapacitysuitsonetodosth.", "how引导主语从句", "tovisualize...andtofigureout...作后置定语（限定capacity）", "that引导定语从句（限定questions）"],
        ref: "想象物体(形状)和破解数值模式的能力如何能使人解答那些曾难倒一些最优秀诗人和哲学家的问题，这一点难以理解。"
      }
    ]
  },
  {
    day: 43,
    type: "英一",
    source: "2007 Text 2",
    zh: "尽管如今 IQ 测试已经不像以前那么频繁地被使用，但 IQ 分数似乎仍是定义人类智力的术语。IQ 测试主要有两种形式：斯坦福一比纳智力量表和韦克斯勒智力量表（二者都有成人版和儿童版）。这两种测试形式费用一般为几百美元，通常只由心理学家提供，不过他们的改编版本在书店和互联网上随处可见。像莎凡那样的超高分数不可能再出现，因为现在分数计算是以同龄群体在统计学意义上的人口分布为基础的，而不是简单地用智力年龄除以生理年龄再乘以 100。其他标准化测试，比如学术评估测验（SAT）和研究生入学考试（GRE），都充分体现了 IQ 测试的主要特点。",
    sentences: [
    { num: "①", en: "The defining term of intelligence in humans still seems to be the IQ score, even though IQ tests are not given as often as they used to be.", ref: "尽管如今 IQ 测试已经不像以前那么频繁地被使用，但 IQ 分数似乎仍是定义人类智力的术语。",
      ai: { backbone: "主语 The defining term of intelligence in humans、系动词 seems to be、表语 the IQ score；even though 引导让步状语从句", structure: ["让步状语从句 even though IQ tests are not given as often as they used to be：说明尽管测试减少仍以智商分数定义智力","比较结构 as often as they used to be：对比过去的使用频率"], collocations: ["defining term（定义性标准）","the IQ score（智商分数）","as often as（与……一样频繁）"] }},
    { num: "②", en: "The test comes primarily in two forms: the Stanford-Binet Intelligence Scale and the Wechsler Intelligence Scales (both come in adult and children’s version).", ref: "IQ 测试主要有两种形式：斯坦福一比纳智力量表和韦克斯勒智力量表（二者都有成人版和儿童版）。",
      ai: { backbone: "主语 The test、谓语 comes、介词短语 in two forms 作状语", structure: ["方式状语 primarily：说明主要形式","并列名词 the Stanford-Binet Intelligence Scale and the Wechsler Intelligence Scales：列举两种量表","括号说明 both come in adult and children's version：补充两种版本"], collocations: ["intelligence scale（智力量表）","adult and children's version（成人版与儿童版）"] }},
    { num: "③", en: "Generally costing several hundred dollars, they are usually given only by psychologists, although variations of them populate bookstores and the World Wide Web.", ref: "这两种测试形式费用一般为几百美元，通常只由心理学家提供，不过他们的改编版本在书店和互联网上随处可见。",
      ai: { backbone: "主语 they、谓语 are given；句首为现在分词短语作让步状语", structure: ["让步状语 Generally costing several hundred dollars：说明虽费用不菲","方式状语 usually only by psychologists：说明由谁施测","让步状语从句 although variations of them populate bookstores and the World Wide Web：说明虽有变体流传"], collocations: ["cost several hundred dollars（花费数百美元）","populate（遍布，充斥）","the World Wide Web（万维网）"] }},
    { num: "④", en: "Superhigh scores like vos Savant’s are no longer possible, because scoring is now based on a statistical population distribution among age peers, rather than simply dividing the mental age by the chronological age and multiplying by 100.", ref: "像莎凡那样的超高分数不可能再出现，因为现在分数计算是以同龄群体在统计学意义上的人口分布为基础的，而不是简单地用智力年龄除以生理年龄再乘以 100。",
      ai: { backbone: "主语 Superhigh scores、系动词 are no longer possible；because 引导原因状语从句", structure: ["原因状语从句 because scoring is now based on a statistical population distribution among age peers：解释原因","比较结构 rather than simply dividing the mental age by the chronological age and multiplying by 100：对比新旧计分方法"], collocations: ["superhigh scores（超高分数）","be based on（基于）","population distribution（人群分布）","age peers（同龄人）"] }},
    { num: "⑤", en: "Other standardized tests, such as the Scholastic Assessment Test (SAT) and the Graduate Record Exam (GRE), capture the main aspects of IQ tests.", ref: "其他标准化测试，比如学术评估测验（SAT）和研究生入学考试（GRE），都充分体现了 IQ 测试的主要特点。",
      ai: { backbone: "主语 Other standardized tests、谓语 capture、宾语 the main aspects of IQ tests", structure: ["插入语 such as the Scholastic Assessment Test (SAT) and the Graduate Record Exam (GRE)：举例说明其他标准化测试"], collocations: ["standardized tests（标准化测试）","capture the main aspects（体现主要方面）","Scholastic Assessment Test（学术能力评估测试）"] }}
    ]
  },
  {
    day: 44,
    type: "英一",
    source: "2007 Text 2",
    zh: "罗伯特·J·斯特恩伯格指出，这类标准化测试也许不能评估在学业和生活中取得成功所必需的所有重要因素。斯特恩伯格在他的《智力测试有多智能?》一文中指出传统测试能够对分析能力和语言能力做出最佳评估，但不能评估创造能力和实践知识，而这两个因素对于解决问题和在生活中取得成功也至关重要。此外，一旦受试群体或环境发生变化，IQ 测试不一定能做出准确预测。研究发现，当（受试者）在压力小的情况下进行测试时，IQ 能预示领导能力（的高低）；但是在压力大的情况下，IQ 与领导能力负相关——也就是说，根据智商预测出的领导能力与实际情况相反。任何熬过“学术能力评估测试”的人都可以证明，应试技巧也很重要，无论是知道何时应该猜测或是（知道）何题应该跳过。",
    sentences: [
    { num: "①", en: "Such standardized tests may not assess all the important elements necessary to succeed in school and in life, argues Robert J. Sternberg.", ref: "罗伯特·J·斯特恩伯格指出，这类标准化测试也许不能评估在学业和生活中取得成功所必需的所有重要因素。",
      ai: { backbone: "主语 Such standardized tests、谓语 may not assess、宾语 all the important elements；尾句为引述倒装", structure: ["宾语从句 all the important elements necessary to succeed in school and in life：作 assess 的宾语","后置定语 necessary to succeed in school and in life：修饰 elements，说明其必要性","引述句 argues Robert J. Sternberg：交代观点提出者"], collocations: ["standardized tests（标准化测试）","assess（评估）","succeed in school and in life（在学业与人生中成功）"] }},
    { num: "②", en: "In his article “How Intelligent Is Intelligence Testing?” , Sternberg notes that traditional tests best assess analytical and verbal skills but fail to measure creativity and practical knowledge, components also critical to problem solving and life success.", ref: "斯特恩伯格在他的《智力测试有多智能?》一文中指出传统测试能够对分析能力和语言能力做出最佳评估，但不能评估创造能力和实践知识，而这两个因素对于解决问题和在生活中取得成功也至关重要。",
      ai: { backbone: "主语 Sternberg、谓语 notes、宾语从句 that traditional tests best assess analytical and verbal skills but fail to measure creativity and practical knowledge", structure: ["时间状语 In his article “How Intelligent Is Intelligence Testing?”：说明出处","宾语从句 that traditional tests...but fail to measure...：作 notes 的宾语","后置定语 components also critical to problem solving and life success：作 creativity and practical knowledge 的同位补充"], collocations: ["analytical and verbal skills（分析与语言技能）","practical knowledge（实践知识）","be critical to（对……至关重要）","problem solving（解决问题）"] }},
    { num: "③", en: "Moreover, IQ tests do not necessarily predict so well once populations or situations change.", ref: "此外，一旦受试群体或环境发生变化，IQ 测试不一定能做出准确预测。",
      ai: { backbone: "主语 IQ tests、谓语 do not necessarily predict、宾语 so well；once 引导时间状语从句", structure: ["时间状语从句 once populations or situations change：说明当环境变化时预测力下降","副词 moreover：承上启下，进一步补充"], collocations: ["necessarily（必然地）","predict（预测）","populations or situations change（人群或情境发生变化）"] }},
    { num: "④", en: "Research has found that IQ predicted leadership skills when the tests were given under low-stress conditions, but under high-stress conditions, IQ was negatively correlated with leadership—that is, it predicted the opposite.", ref: "研究发现，当（受试者）在压力小的情况下进行测试时，IQ 能预示领导能力（的高低）；但是在压力大的情况下，IQ 与领导能力负相关——也就是说，根据智商预测出的领导能力与实际情况相反。",
      ai: { backbone: "主语 Research、谓语 has found、宾语从句 IQ predicted leadership skills when...but under...IQ was negatively correlated with leadership", structure: ["宾语从句 IQ predicted leadership skills...but under high-stress conditions, IQ was negatively correlated with leadership：作 found 的宾语，含转折并列","时间状语从句 when the tests were given under low-stress conditions：说明低压力条件","破折号后的解释 that is, it predicted the opposite：说明负相关即预测相反结果"], collocations: ["leadership skills（领导能力）","under low-stress conditions（在低压条件下）","be negatively correlated with（与……呈负相关）"] }},
    { num: "⑤", en: "Anyone who has toiled through SAT will testify that test-taking skill also matters, whether it’s knowing when to guess or what questions to skip.", ref: "任何熬过“学术能力评估测试”的人都可以证明，应试技巧也很重要，无论是知道何时应该猜测或是（知道）何题应该跳过。",
      ai: { backbone: "主语 Anyone、谓语 will testify、宾语从句 that test-taking skill also matters", structure: ["定语从句 who has toiled through SAT：修饰 Anyone，限定为经历过 SAT 的人","宾语从句 that test-taking skill also matters：作 testify 的宾语","方式状语 whether it's knowing when to guess or what questions to skip：说明应试技巧的具体内容"], collocations: ["toil through（艰难地通过）","test-taking skill（应试技巧）","know when to guess（知道何时猜答案）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "testifyv.证明", word: "testify", meaning: "v.证明" },
      { raw: "matterv.要紧，有关系", word: "matter", meaning: "v.要紧，有关系" },
      { raw: "toiledthrough艰难跋涉，历尽困苦做某事", word: "toiledthrough艰难跋涉，历尽困苦做某事", meaning: "" }
    ],
        split: "Anyone//whohastoiledthroughSATwilltestify//thattest-takingskillalso matters,//whetherit’sknowingwhentoguessorwhatquestionstoskip.",
        grammar: ["主干：主+谓+宾从", "who引导定语从句", "that引导宾语从句", "whether引导同位语从句"],
        ref: "任何熬过“学术能力评估测试”的人都可以证明，应试技能也很重要，即/无论是知道何时应该猜测或者什么题目可以略过不答。"
      }
    ]
  },
  {
    day: 45,
    type: "英一",
    source: "2007 Text 3",
    zh: "在过去一代人的时间里，原本依靠努力工作和公平竞争便能保持自身经济安稳的美国中产阶级家庭已被经济风险和新的现实彻底改变。现在，一张粉色小纸条（解雇通知书），一个恶性诊断结果，或者离散的配偶，都可以使一个家庭从殷实的中产阶级在几个月内沦为新贫阶层。",
    sentences: [
    { num: "①", en: "During the past generation, the American middle-class family that once could count on hard work and fair play to keep itself financially secure has been transformed by economic risk and new realities.", ref: "在过去一代人的时间里，原本依靠努力工作和公平竞争便能保持自身经济安稳的美国中产阶级家庭已被经济风险和新的现实彻底改变。",
      ai: { backbone: "主语 the American middle-class family、谓语 has been transformed；后接定语从句", structure: ["时间状语 During the past generation：说明转变的时期","定语从句 that once could count on hard work and fair play to keep itself financially secure：修饰 family，说明其过去依靠","介词短语 by economic risk and new realities：说明转变的原因","并列后置定语 of hard work and fair play：修饰 count on 的对象"], collocations: ["count on（依靠，指望）","hard work and fair play（勤奋与公平竞争）","financially secure（经济上安全）","economic risk（经济风险）"] }},
    { num: "②", en: "Now a pink slip, a bad diagnosis, or a disappearing spouse can reduce a family from solidly middle class to newly poor in a few months.", ref: "现在，一张粉色小纸条（解雇通知书），一个恶性诊断结果，或者离散的配偶，都可以使一个家庭从殷实的中产阶级在几个月内沦为新贫阶层。",
      ai: { backbone: "主语 a pink slip, a bad diagnosis, or a disappearing spouse、谓语 can reduce、宾语 a family、宾补 from solidly middle class to newly poor", structure: ["时间状语 Now：点明当下","并列主语 a pink slip, a bad diagnosis, or a disappearing spouse：列举三种变故","时间状语 in a few months：说明变穷的速度"], collocations: ["a pink slip（解雇通知书）","reduce...from...to...（使……从……沦为……）","middle class（中产阶级）","newly poor（新贫困）"] }}
    ]
  },
  {
    day: 46,
    type: "英一",
    source: "2007 Text 3",
    zh: "在仅仅一代人的时间里，数百万母亲已出去工作，改变了基本的家庭经济（模式），学者、政策制定者以及各路评论家都已反复讨论这些变化的社会意义，但几乎没人仔细研究过其副作用：家庭风险也提高了。如今家庭的开支已达这种新双薪状态的极限结果，他们失去了经济受挫时期曾经拥有的“降落伞”——一个在家庭经济支柱失业或生病时可以走进职场的候补赚钱者（通常是母亲）。这种“附加的劳动者效应”能够增强失业保险或伤残保险所提供的安全保障网帮助家庭渡过难关。但如今，家庭时运遭到的破坏再也不能通过原本赋闲在家的另一半获得的额外收入得以弥补。",
    sentences: [
    { num: "①", en: "In just one generation, millions of mothers have gone to work,transforming basic family economics. Scholars, policymakers, and critics of all stripes have debated the social implications of these changes, but few have looked at the side effect: family risk has risen as well.", ref: "在仅仅一代人的时间里，数百万母亲已出去工作，改变了基本的家庭经济（模式），学者、政策制定者以及各路评论家都已反复讨论这些变化的社会意义，但几乎没人仔细研究过其副作用：家庭风险也提高了。",
      ai: { backbone: "分号前：主语 millions of mothers、谓语 have gone、介词短语 to work；分词短语作结果状语；分号后：并列主语与谓语", structure: ["时间状语 In just one generation：说明时间跨度","现在分词短语 transforming basic family economics：作结果状语","后接并列句 Scholars, policymakers, and critics of all stripes have debated...but few have looked at the side effect：说明学界关注点","宾语从句 family risk has risen as well：作 looked at 的宾语"], collocations: ["in just one generation（仅在一代人的时间里）","go to work（上班工作）","critics of all stripes（各界批评人士）","side effect（副作用，附带影响）"] }},
    { num: "②", en: "Today’s families have budgeted to the limits of their\u0003new two-paycheck status. As a result, they have lost the parachute they once had in times of financial setback—a back-up earner (usually Mom) who could go into the workforce if the primary earner got laid off or fell sick.", ref: "如今家庭的开支已达这种新双薪状态的极限结果，他们失去了经济受挫时期曾经拥有的“降落伞”——一个在家庭经济支柱失业或生病时可以走进职场的候补赚钱者（通常是母亲）。",
      ai: { backbone: "分句1 主语 Today's families、谓语 have budgeted、介词短语 to the limits 作状语；分句2 主语 they、谓语 have lost、宾语 the parachute", structure: ["分句1 时间状语 Today 与后置定语 of their new two-paycheck status：说明预算依据","分句2 结果状语 As a result：说明因果关系","定语从句 they once had in times of financial setback：修饰 parachute","破折号后的同位语 a back-up earner (usually Mom)：解释 parachute 即后备挣钱者","定语从句 who could go into the workforce if the primary earner got laid off or fell sick：说明后备者的作用"], collocations: ["budget to the limits（预算到极限）","two-paycheck status（双薪状态）","financial setback（财务挫折）","back-up earner（后备挣钱者）","get laid off（被解雇）"] }},
    { num: "③", en: "This “added-worker effect” could support the safety net offered by unemployment insurance or disability insurance to help families weather bad times.", ref: "这种“附加的劳动者效应”能够增强失业保险或伤残保险所提供的安全保障网帮助家庭渡过难关。",
      ai: { backbone: "主语 This “added-worker effect”、谓语 could support、宾语 the safety net；to 引导目的状语", structure: ["过去分词短语 offered by unemployment insurance or disability insurance：作后置定语，修饰 safety net","不定式短语 to help families weather bad times：作目的状语","宾语从句省略：help families（to）weather bad times"], collocations: ["added-worker effect（附加劳动力效应）","safety net（安全网）","unemployment insurance（失业保险）","weather bad times（渡过艰难时期）"] }},
    { num: "④", en: "But today, a disruption to family fortunes can no longer be made up with extra income from an otherwise-stay-at-home partner.", ref: "但如今，家庭时运遭到的破坏再也不能通过原本赋闲在家的另一半获得的额外收入得以弥补。",
      ai: { backbone: "主语 a disruption to family fortunes、谓语 can no longer be made up；with 引导方式状语", structure: ["时间状语 But today：强调今昔对比","介词短语 with extra income from an otherwise-stay-at-home partner：说明弥补方式","复合形容词 otherwise-stay-at-home：修饰 partner，指原本居家者"], collocations: ["a disruption to（对……的破坏）","make up（弥补）","extra income（额外收入）","no longer（不再）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "parachuten.降落伞（保护伞）", word: "parachute", meaning: "n.降落伞（保护伞）" },
      { raw: "setbackn.挫折阻碍", word: "setback", meaning: "n.挫折阻碍" },
      { raw: "back-upn.援助，后备人员", word: "back-up", meaning: "n.援助，后备人员" },
      { raw: "getlaidoff被解雇，被裁员（失业）", word: "getlaidoff被解雇，被裁员（失业）", meaning: "" }
    ],
        split: "Asaresult,//theyhavelosttheparachute//(that)theyoncehad//intimesof financialsetback—//aback-upearner(usuallyMom)//whocouldgointothe workforce//iftheprimaryearnergotlaidoff//orfellsick.",
        grammar: ["主干：主+谓+宾", "parachute后省略that引导定语从句", "who引导定语从句", "if引导条件状语从句"],
        ref: "结果，他们失去了经济受挫时期曾经拥有的“降落伞”——一个在家庭经济支柱失业或生病时可以走进职场的候补赚钱者(通常是母亲)。"
      }
    ]
  },
  {
    day: 47,
    type: "英一",
    source: "2007 Text 3",
    zh: "与此同时，家庭被要求在退休收入方面承担（比以前）大得多的风险。钢铁工人、航空公司雇员以及现在汽车行业的员工正在加入数百万家庭，必须担忧利率、股市波动以及退休金不足以养老这一严酷现实。去年的大半年之中，布什总统领导了将社会保障体系变成储蓄账户模式的改革运动，（在这种模式下，）退休人员的大部分或全部的“有保障的收入”变成了“依赖投资收益的收入”。对于较年轻的家庭来说，境况并没有好出丝毫。医疗保健的绝对成本以及其中家庭承担的份额都已提高——且新近流行的健康储蓄计划正从国会大厅蔓延到沃尔玛员工那里，随之而来的是比过去高出许多的医疗保险免赔额，以及家庭未来的医疗保健所面临的大量新增投资风险。甚至人口统计数据都对中产阶级家庭不利，因为（据统计）家庭中出现年老力衰的父（母）——以及随之而来的体力和经济援助需要——的几率在仅仅一代人的时间里就猛涨到原来的八倍。",
    sentences: [
    { num: "①", en: "During the same period, families have been asked to absorb much more risk in their retirement income.", ref: "与此同时，家庭被要求在退休收入方面承担（比以前）大得多的风险。",
      ai: { backbone: "主语 families、谓语 have been asked to absorb、宾语 much more risk", structure: ["时间状语 During the same period：说明同一时期","介词短语 in their retirement income：说明风险所在领域"], collocations: ["be asked to do（被要求做）","absorb risk（承担风险）","retirement income（退休收入）"] }},
    { num: "②", en: "Steelworkers, airline employees, and now those in the auto industry are joining millions of families who must worry about interest rates, stock market fluctuation, and the harsh reality that they may outlive their retirement money.", ref: "钢铁工人、航空公司雇员以及现在汽车行业的员工正在加入数百万家庭，必须担忧利率、股市波动以及退休金不足以养老这一严酷现实。",
      ai: { backbone: "主语 Steelworkers, airline employees, and now those in the auto industry、谓语 are joining、宾语 millions of families", structure: ["定语从句 who must worry about interest rates, stock market fluctuation, and the harsh reality：修饰 families","同位语从句 that they may outlive their retirement money：解释 reality 的内容"], collocations: ["interest rates（利率）","stock market fluctuation（股市波动）","outlive one's retirement money（活得比退休金还久）"] }},
    { num: "③", en: "For much of the past year, President Bush campaigned to move Social Security to a savings-account model, with retirees trading much or all of their guaranteed payments for payments depending on investment returns.", ref: "去年的大半年之中，布什总统领导了将社会保障体系变成储蓄账户模式的改革运动，（在这种模式下，）退休人员的大部分或全部的“有保障的收入”变成了“依赖投资收益的收入”。",
      ai: { backbone: "主语 President Bush、谓语 campaigned to move、宾语 Social Security；with 引导伴随状语", structure: ["时间状语 For much of the past year：说明持续时间","不定式短语 to move Social Security to a savings-account model：作 campaigned 的目的","介词短语 with retirees trading much or all of their guaranteed payments：作伴随状语，说明置换方式","后置定语 for payments depending on investment returns：说明置换后的支付来源"], collocations: ["campaign to do（发起运动做……）","savings-account model（储蓄账户模式）","guaranteed payments（有保障的支付）","investment returns（投资回报）"] }},
    { num: "④", en: "For younger families, the picture is not any better.", ref: "对于较年轻的家庭来说，境况并没有好出丝毫。",
      ai: { backbone: "主语 the picture、系动词 is not、表语 any better", structure: ["时间状语 For younger families：说明针对对象"], collocations: ["for younger families（对年轻家庭而言）","the picture is not any better（情况并未好转）"] }},
    { num: "⑤", en: "Both the absolute cost of healthcare and the share of it borne by families have risen—and newly fashionable health-savings plans are spreading from legislative halls to Wal-Mart workers, with much higher deductibles and a large new dose of investment risk for families’ future healthcare.", ref: "医疗保健的绝对成本以及其中家庭承担的份额都已提高——且新近流行的健康储蓄计划正从国会大厅蔓延到沃尔玛员工那里，随之而来的是比过去高出许多的医疗保险免赔额，以及家庭未来的医疗保健所面临的大量新增投资风险。",
      ai: { backbone: "主语 Both the absolute cost of healthcare and the share of it、谓语 have risen；and 连接第二分句", structure: ["后置定语 of healthcare：修饰 cost，限定领域","后置定语 of it borne by families：修饰 share，说明家庭承担的部分","分句2 主语 health-savings plans、谓语 are spreading from...to...：说明计划扩散范围","介词短语 with much higher deductibles and a large new dose of investment risk：说明新计划的特征"], collocations: ["the absolute cost of healthcare（医疗保健的绝对成本）","be borne by（由……承担）","health-savings plans（健康储蓄计划）","legislative halls（立法大厅，立法机构）","a dose of investment risk（一股投资风险）"] }},
    { num: "⑥", en: "Even demographics are working against the middle class family, as the odds of having a weak elderly parent—and all the attendant need for physical and financial assistance—have jumped eightfold in just one generation.", ref: "甚至人口统计数据都对中产阶级家庭不利，因为（据统计）家庭中出现年老力衰的父（母）——以及随之而来的体力和经济援助需要——的几率在仅仅一代人的时间里就猛涨到原来的八倍。",
      ai: { backbone: "主语 Even demographics、谓语 are working against、宾语 the middle class family；as 引导原因状语从句", structure: ["原因状语从句 as the odds...have jumped eightfold in just one generation：解释不利原因","后置定语 of having a weak elderly parent：修饰 odds","and 连接的并列成分 all the attendant need for physical and financial assistance：说明随之而来的需求"], collocations: ["work against（对……不利）","demographics（人口结构）","the odds of（……的可能性）","eightfold（八倍地）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "absoluteadj.完全的，纯粹的", word: "absolute", meaning: "adj.完全的，纯粹的" },
      { raw: "healthcaren.医疗保健服务", word: "healthcare", meaning: "n.医疗保健服务" },
      { raw: "deductiblesn.免赔额", word: "deductibles", meaning: "n.免赔额" },
      { raw: "legislativehalls立法大厅", word: "legislativehalls立法大厅", meaning: "" },
      { raw: "alargenewdoseof大量新增的", word: "alargenewdoseof大量新增的", meaning: "" }
    ],
        split: "Boththeabsolutecost//ofhealthcare//andtheshare//ofit//bornebyfamilies haverisen—//andnewlyfashionablehealth-savingsplansarespreading//from legislativehalls//toWal-Martworkers,//withmuchhigherdeductibles//andalarge newdoseofinvestmentrisk//forfamilies’futurehealthcare.",
        grammar: ["主干：主+谓", "第一个and并列thecost和theshare", "第二个and放在破折号之后并列一个分句表示补充说明", "第三个and并列higherdeductibles和alargenewdoseofinvestmentrisk"],
        ref: "医疗保健的绝对成本以及其中家庭承担的份额都已提高—且新近流行的健康储蓄计划正从国会大厅蔓延到沃尔玛员工那里，随之而来的是比过去高出许多的医疗保险免赔额，以及家庭未来的医疗保健所面临的大量新增投资风险。"
      },
      {
        sentNum: "⑥",
        vocab: [
      { raw: "demographicsn.人口统计资料", word: "demographics", meaning: "n.人口统计资料" },
      { raw: "oddsn.(事物发生的)可能性", word: "odds", meaning: "n.(事物发生的)可能性" },
      { raw: "attendantadj.伴随的，随之而来的", word: "attendant", meaning: "adj.伴随的，随之而来的" },
      { raw: "eightfoldadj./adv.八倍的（地）", word: "eightfold", meaning: "adj./adv.八倍的（地）" },
      { raw: "workagainst对...不利", word: "workagainst对...不利", meaning: "" }
    ],
        split: "Evendemographicsareworkingagainstthemiddleclassfamily,//astheodds //ofhavingaweakelderlyparent—andalltheattendantneed//forphysicaland financialassistance—havejumpedeightfold//injustonegeneration.",
        grammar: ["主干：主+谓+宾", "workagainst对...不利", "as引导原因状语从句", "and并列两个可能性结构提炼：theodds//ofAandBhavejumpedeightfold"],
        ref: "甚至人口统计数据都对中产阶级家庭不利，因为(据统计)家庭中出现年老力衰的父(母)---以及随之而来的体力和经济援助需要的几率在仅仅一代人的时间里就猛涨到原来的八倍。"
      }
    ]
  },
  {
    day: 48,
    type: "英一",
    source: "2007 Text 3",
    zh: "可以理解，从中产阶级家庭的角度看，上述许多现象看起来远不像是履行更多经济责任的机会，而更像是以骇人的增速将金融风险大规模转嫁到他们已经不堪重负的肩膀上。经济上的不良后果已经显现，政治影响也不会太远了。",
    sentences: [
    { num: "①", en: "From the middle-class family perspective, much of this, understandably, looks far less like an opportunity to exercise more financial responsibility, and a good deal more like a frightening acceleration of the wholesale shift of financial risk onto their already overburdened shoulders.", ref: "可以理解，从中产阶级家庭的角度看，上述许多现象看起来远不像是履行更多经济责任的机会，而更像是以骇人的增速将金融风险大规模转嫁到他们已经不堪重负的肩膀上。",
      ai: { backbone: "主语 much of this、谓语 looks、介词短语 like...作表语；and 连接第二谓语", structure: ["时间状语 From the middle-class family perspective：说明观察视角","插入语 understandably：表示可以理解","比较结构 far less like...and a good deal more like...：not only...but 的变体对比两种观感","后置定语 of the wholesale shift of financial risk：修饰 acceleration","后置定语 onto their already overburdened shoulders：说明风险转移对象"], collocations: ["from the perspective of（从……的角度）","far less like（远不像）","a good deal more like（更像得多）","wholesale shift（全面转移）","overburdened shoulders（不堪重负的肩膀）"] }},
    { num: "②", en: "The financial fallout has begun, and the political fallout may not be far behind.", ref: "经济上的不良后果已经显现，政治影响也不会太远了。",
      ai: { backbone: "and 连接两个并列分句：分句1 主语 The financial fallout、谓语 has begun；分句2 主语 the political fallout、系动词 may be", structure: ["表语 not far behind：说明政治影响紧随其后","副词 may：表示不确定性"], collocations: ["financial fallout（金融余波）","political fallout（政治余波）","not far behind（紧随其后）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "exercisev.运用，行使（履行/承担）", word: "exercise", meaning: "v.运用，行使（履行/承担）" },
      { raw: "accelerationn.加速", word: "acceleration", meaning: "n.加速" },
      { raw: "wholesaleadj.大批的，大规模的", word: "wholesale", meaning: "adj.大批的，大规模的" },
      { raw: "overburdenedadj.负担过重的", word: "overburdened", meaning: "adj.负担过重的" },
      { raw: "fromone’sperspective从某人的角度来看", word: "fromone’sperspective从某人的角度来看", meaning: "" },
      { raw: "agooddeal大量的", word: "agooddeal大量的", meaning: "" }
    ],
        split: "Fromthemiddle-classfamilyperspective,//muchofthis,//understandably,//looks farlesslikeanopportunity//toexercisemorefinancialresponsibility,//andagood dealmorelikeafrighteningacceleration//ofthewholesaleshift//offinancialrisk //ontotheiralreadyoverburdenedshoulders.",
        grammar: ["主干：主+系+表", "主干结构提炼：MuchofthislooksfarlesslikeA,andagooddealmorelikeB.", "toexercise...作后置定语", "ofthewholesale...作后置定语"],
        ref: "可以理解，从中产阶级家庭的角度看，上述许多现象看起来远不像是履行更多经济责任的机会，而更像是以骇人的增速将金融风险大规模转嫁到他们已经不堪重负的肩膀上。"
      }
    ]
  },
  {
    day: 49,
    type: "英一",
    source: "2007 Text 4",
    zh: "不雨则已，雨则倾盆。正值老板、董事会们总算解决了最为棘手的财务和合规问题，并且改善了薄弱的公司治理之际，一个新的问题又可能为他们惹来——尤其是在美国——那种不可避免地使管理层受重罚的负面头条，这个问题就是：数据不安全。此前，信息保护一直是由古怪而又低级的信息技术员工来负责，并且被看作只是诸如银行、电信、航空旅行这类拥有大量数据的行业才关注的问题，而现在却高居各行业老板的议程表之首。",
    sentences: [
    { num: "①", en: "It never rains but it pours.", ref: "不雨则已，雨则倾盆。",
      ai: { backbone: "主语 it、谓语 rains；后接 not...but 结构的状语", structure: ["否定副词 never：强调不雨则已","并列结构 not...but...：表达“不……则……”，强调雨不止一场","副词 pours：与 rains 呼应，表示倾盆而下"], collocations: ["it never rains but it pours（不雨则已，一雨倾盆；祸不单行）","pour（倾泻）"] }},
    { num: "②", en: "Just as bosses and boards have finally sorted out their worst accounting and compliance troubles, and improved their feeble corporation governance, a new problem threatens to earn them—especially in America—the sort of nasty headlines that inevitably lead to heads rolling in the executive suite: data insecurity.", ref: "正值老板、董事会们总算解决了最为棘手的财务和合规问题，并且改善了薄弱的公司治理之际，一个新的问题又可能为他们惹来——尤其是在美国——那种不可避免地使管理层受重罚的负面头条，这个问题就是：数据不安全。",
      ai: { backbone: "主语 a new problem、谓语 threatens to earn、宾语 them、宾补 the sort of nasty headlines；句首为 just as 时间状语从句", structure: ["时间状语从句 Just as bosses and boards have finally sorted out...and improved...：说明在解决旧问题的同时","并列谓语 sorted out their worst accounting and compliance troubles and improved their feeble corporation governance：说明刚完成的整顿","插入语 especially in America：强调地点","定语从句 that inevitably lead to heads rolling in the executive suite：修饰 headlines，说明后果","冒号后的名词 data insecurity：对 a new problem 作同位解释"], collocations: ["sort out（解决，整顿）","accounting and compliance troubles（会计与合规问题）","corporate governance（公司治理）","heads roll（人头落地，负责人被解职）","executive suite（高管层）"] }},
    { num: "③", en: "Left, until now, to odd, low-level IT staff to put right, and seen as a concern only of data-rich industries such as banking, telecoms and air travel, information protection is now high on the boss’s agenda in businesses of every variety.", ref: "此前，信息保护一直是由古怪而又低级的信息技术员工来负责，并且被看作只是诸如银行、电信、航空旅行这类拥有大量数据的行业才关注的问题，而现在却高居各行业老板的议程表之首。",
      ai: { backbone: "主语 information protection、系动词 is、表语 high；句首为过去分词短语作状语", structure: ["过去分词短语 Left, until now, to odd, low-level IT staff to put right：作让步/背景状语，说明过去被交给底层 IT 处理","过去分词短语 seen as a concern only of data-rich industries...：作并列背景状语","介词短语 in businesses of every variety：说明如今波及各类企业","状语 now high on the boss's agenda：说明如今成为优先事项"], collocations: ["low-level IT staff（基层 IT 人员）","put right（纠正，修复）","data-rich industries（数据密集型行业）","high on the agenda（列入重要议程）","of every variety（各种各样的）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "boardsn.董事会accountingn.财务", word: "boards", meaning: "n.董事会accountingn.财务" },
      { raw: "compliancen.服从，遵守feebleadj.脆弱的", word: "compliance", meaning: "n.服从，遵守feebleadj.脆弱的" },
      { raw: "earnv.招惹nastyadj.恶毒的，令人厌恶的", word: "earn", meaning: "v.招惹nastyadj.恶毒的，令人厌恶的" },
      { raw: "headsn.领导人suiten.（一批）随员，随从", word: "heads", meaning: "n.领导人suiten.（一批）随员，随从" },
      { raw: "sortout解决", word: "sortout解决", meaning: "" },
      { raw: "nastyheadlines恶意标题（指那些带有攻击性、挑衅性或不实信息的标题，通", word: "nastyheadlines恶意标题（指那些带有攻击性、挑衅性或不实信息的标题，通", meaning: "" },
      { raw: "常被用于引起争议或吸引读者的注意）", word: "常被用于", meaning: "引起争议或吸引读者的注意）" }
    ],
        split: "",
        grammar: [],
        ref: ""
      },
      {
        sentNum: "③",
        vocab: [
      { raw: "oddadj.奇怪的，偶然出现的", word: "odd", meaning: "adj.奇怪的，偶然出现的" },
      { raw: "varietyn.种类，各式各样", word: "variety", meaning: "n.种类，各式各样" },
      { raw: "beleftto由...决定，由...负责", word: "beleftto由...决定，由...负责", meaning: "" },
      { raw: "putright纠正", word: "putright纠正", meaning: "" },
      { raw: "behighonone’sagenda高居某人议程表", word: "behighonone’sagenda高居某人议程", meaning: "表" }
    ],
        split: "Left,//untilnow,//toodd,low-levelITstaff//toputright,//andseenasaconcern //onlyofdata-richindustries//suchasbanking,telecomsandairtravel,information protectionisnowhighontheboss’sagenda//inbusinesses//ofeveryvariety.",
        grammar: ["主干：主+系+表", "leftto...andseenas...两个过去分词结构并列作状语", "onlyof....介词短语作后置定语（限定concern）", "inbusiness...介词短语作后置定语（限定boss’sagenda）"],
        ref: "此前，信息保护一直是由古怪而又低级的信息技术员工来负责，并且被看作只是诸如银行、电信、航空旅行这类拥有大量数据的行业才关注的问题，而现在却高居各行业老板的议程表之首。"
      }
    ]
  },
  {
    day: 50,
    type: "英一",
    source: "2007 Text 4",
    zh: "今年几起重大的客户和员工数据泄露事件——发生于各类机构里，如时代华纳公司、美国国防项目承包商科学应用国际公司、甚至加州大学伯克利分校——使得管理者们慌忙检查自身复杂精细的信息技术系统和业务流程，以寻找潜在的漏洞。",
    sentences: [
    { num: "①", en: "Several massive leakages of customer and employee data this year—from organizations as diverse as Time Warner, the American defense contractor Science Applications International Corp and even the University of California, Berkeley—have left managers hurriedly peering into their intricate IT systems and business processes in search of potential vulnerabilities.", ref: "今年几起重大的客户和员工数据泄露事件——发生于各类机构里，如时代华纳公司、美国国防项目承包商科学应用国际公司、甚至加州大学伯克利分校——使得管理者们慌忙检查自身复杂精细的信息技术系统和业务流程，以寻找潜在的漏洞。",
      ai: { backbone: "主语 Several massive leakages、谓语 have left、宾语 managers、宾补 peering into...；破折号内为插入语", structure: ["时间状语 this year：说明发生时间","介词短语 from organizations as diverse as Time Warner...：说明泄密来源机构","破折号插入语列举多个机构：Time Warner, SAIC, University of California, Berkeley","现在分词短语 peering into their intricate IT systems and business processes：作宾语补足语，说明经理们慌忙检查","不定式短语 in search of potential vulnerabilities：作目的状语"], collocations: ["massive leakages（大规模泄密）","customer and employee data（客户与员工数据）","peer into（仔细查看）","intricate IT systems（错综复杂的 IT 系统）","in search of（寻找）","potential vulnerabilities（潜在漏洞）"] }}
    ]
  },
  {
    day: 51,
    type: "英一",
    source: "2007 Text 4",
    zh: "斯坦福大学商学院的海姆·孟德尔森说:“数据正在变成一种资产，与任何其他资产一样，它也需要受到保护。保护客户数据的能力是（保证）市场价值的关键，董事会应当为了股东的利益对市场价值负责。的确，正如有一般公认会计原则（GAAP）的概念一样，或许现在是该制定一般公认安全原则（GAAP）的时候了，纽约哥伦比亚大学商学院的伊菜·诺姆这样建议道。他指出：“为（数据）安全、冗余以及恢复设立恰当的投资标准是个管理问题，而不是技术问题。”",
    sentences: [
    { num: "①", en: "“Data is becoming an asset which needs to be guarded as much as any other asset,” says Haim Mendelson of Stanford University’s business school.", ref: "斯坦福大学商学院的海姆·孟德尔森说:“数据正在变成一种资产，与任何其他资产一样，它也需要受到保护。",
      ai: { backbone: "引语 Data is becoming an asset 作宾语，主语 Haim Mendelson、谓语 says；后接同位语", structure: ["引语中主语 Data、谓语 is becoming、表语 an asset","定语从句 which needs to be guarded as much as any other asset：修饰 asset，说明其重要程度","同位语 of Stanford University's business school：说明说话者身份"], collocations: ["become an asset（成为一种资产）","guard（保护，守护）","as much as（与……一样多）"] }},
    { num: "②", en: "“The ability to guard customer data is the key to market value, which the board is responsible for on behalf of shareholders”.", ref: "保护客户数据的能力是（保证）市场价值的关键，董事会应当为了股东的利益对市场价值负责。",
      ai: { backbone: "主语 The ability to guard customer data、系动词 is、表语 the key to market value；后接非限制性定语从句", structure: ["不定式短语 to guard customer data：作 ability 的后置定语","介词短语 to market value：作 key 的后置定语","非限制性定语从句 which the board is responsible for on behalf of shareholders：修饰 key，说明董事会责任"], collocations: ["the key to（……的关键）","market value（市场价值）","be responsible for（对……负责）","on behalf of（代表）"] }},
    { num: "③", en: "Indeed, just as there is the concept of Generally Accepted Accounting Principles (GAAP), perhaps it is time for GASP, Generally Accepted Security Practices, suggested Eli Noam of New York’s Columbia Business School.", ref: "的确，正如有一般公认会计原则（GAAP）的概念一样，或许现在是该制定一般公认安全原则（GAAP）的时候了，纽约哥伦比亚大学商学院的伊菜·诺姆这样建议道。",
      ai: { backbone: "主语 it、系动词 is、表语 time for GASP；句首为让步/类比从句；尾句为引述倒装", structure: ["类比从句 just as there is the concept of Generally Accepted Accounting Principles (GAAP)：说明类比对象","祈使/建议结构 perhaps it is time for...：表达建议","同位语 Generally Accepted Security Practices：解释 GASP 全称","引述句 suggested Eli Noam of New York's Columbia Business School：说明观点来源"], collocations: ["Generally Accepted Accounting Principles（公认会计原则）","it is time for（是……的时候了）","security practices（安全惯例）"] }},
    { num: "④", en: "“Setting the proper investment level for security, redundancy, and recovery is a management issue, not a technical one,” he says.", ref: "他指出：“为（数据）安全、冗余以及恢复设立恰当的投资标准是个管理问题，而不是技术问题。”",
      ai: { backbone: "主语 Setting the proper investment level...、系动词 is、表语 a management issue；后接引述句", structure: ["动名词短语 Setting the proper investment level for security, redundancy, and recovery：作句子主语","介词短语 for security, redundancy, and recovery：说明投资对象","否定结构 not a technical one：强调是管理问题而非技术问题","引述句 he says：交代出处"], collocations: ["investment level（投资水平）","redundancy（冗余）","recovery（恢复）","a management issue（管理问题）"] }}
    ]
  },
  {
    day: 52,
    type: "英一",
    source: "2007 Text 4",
    zh: "难以理解的是，这竟然令所有的老板们都大吃一惊。无疑的是，即使最愚笨的管理人员也应该会清楚地知道：信任，也即经济资产中最具价值的东西，很容易遭到破坏而修复起来代价高昂；没有什么事情比企业任由个人敏感信息落入别有用心的人手中更能破坏信任的了。",
    sentences: [
    { num: "①", en: "The mystery is that this should come as a surprise to any boss.", ref: "难以理解的是，这竟然令所有的老板们都大吃一惊。",
      ai: { backbone: "主语 The mystery、系动词 is、表语从句 that this should come as a surprise to any boss", structure: ["表语从句 that this should come as a surprise to any boss：作 is 的表语，说明谜团所在","介词短语 to any boss：说明令人惊讶的对象"], collocations: ["the mystery is that（谜团在于……）","come as a surprise（令人惊讶）"] }},
    { num: "②", en: "Surely it should be obvious to the dimmest executive that trust, that most valuable of economic assets, is easily destroyed and hugely expensive to restore—and that few things are more likely to destroy trust than a company letting sensitive personal data get into the wrong hands.", ref: "无疑的是，即使最愚笨的管理人员也应该会清楚地知道：信任，也即经济资产中最具价值的东西，很容易遭到破坏而修复起来代价高昂；没有什么事情比企业任由个人敏感信息落入别有用心的人手中更能破坏信任的了。",
      ai: { backbone: "主语 it、系动词 should be、表语 obvious to the dimmest executive；that 引导主语从句", structure: ["主语从句 that trust...is easily destroyed and hugely expensive to restore：作真正主语","后置定语 of economic assets：修饰 trust，说明其经济属性","插入语 that most valuable of economic assets：作 trust 的同位语","并列宾语从句 and that few things are more likely to destroy trust than a company letting sensitive personal data get into the wrong hands：补充第二个判断"], collocations: ["be obvious to（对……显而易见）","economic assets（经济资产）","be destroyed（被摧毁）","expensive to restore（恢复代价高昂）","get into the wrong hands（落入不当之人手中）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "dimadj.暗淡的；愚笨的", word: "dim", meaning: "adj.暗淡的；愚笨的" },
      { raw: "economicasset经济资产", word: "economicasset经济资产", meaning: "" }
    ],
        split: "Surelyitshouldbeobvious//tothedimmestexecutive//thattrust,//thatmost valuableofeconomicassets,iseasilydestroyed//andhugelyexpensive//to restore—//andthatfewthingsaremorelikelytodestroytrust//thanacompany //lettingsensitivepersonaldatagetintothewronghands.",
        grammar: ["主干：主+系+表（形式主语+系+表+主语从句）", "主干结构提炼：itshouldbeobviousthatA--andthatB", "第一个that引导主语从句", "第一个and并列iseasilydestroyed和（is）expensive", "第二个and并列两个主语从句（表示补充说明）", "than...作比较状语", "补充：否定词+比较级=最高级fewthingsaremorelikelytodosth.thanA"],
        ref: "无疑的是，即使最愚笨的管理人员也应该会清楚地知道：信任，也即经济资产中最具价值的东西，很容易遭到破坏而修复起来代价高昂；没有什么事情比企业任由个人敏感信息落入别有用心的人手中更能破坏信任的了。"
      }
    ]
  },
  {
    day: 53,
    type: "英一",
    source: "2007 Text 4",
    zh: "（美国，而不是欧洲）欠缺针对数据泄露的法律惩处，这种情况虽不至于证明当前事态合理，但却可能助长其发展。加州最近通过了一项法律，在此之前，美国的公司在数据丢失时无需通知任何人，甚至是受害者本人。这种情况可能很快就会改变：大量有关数据安全的立法提案正在国会接受审议。与此同时，美国 6 月 17 日披露的一起涉及大约 4000 万信用卡账户的信息失窃案，又使得美国联邦贸易委员会头一天（16 日）做出的一项极为重大的决议——该决议警告美国商界，如果公司不能充分保障数据的安全，那么监管机构就会采取措施——颜面尽失。",
    sentences: [
    { num: "①", en: "The current state of affairs may have been encouraged—though not justified—by the lack of legal penalty (in America, but not Europe) for data leakage.", ref: "（美国，而不是欧洲）欠缺针对数据泄露的法律惩处，这种情况虽不至于证明当前事态合理，但却可能助长其发展。",
      ai: { backbone: "主语 The current state of affairs、谓语 may have been encouraged；破折号内为插入；by 引出施动者", structure: ["破折号插入语 though not justified：说明虽有鼓励但并非正当","介词短语 by the lack of legal penalty：说明鼓励因素","括号说明 (in America, but not Europe)：说明地域差异","介词短语 for data leakage：说明惩罚针对的行为"], collocations: ["state of affairs（事态，状况）","legal penalty（法律惩罚）","data leakage（数据泄露）"] }},
    { num: "②", en: "Until California recently passed a law, American firms did not have to tell anyone, even the victim, when data went astray.", ref: "加州最近通过了一项法律，在此之前，美国的公司在数据丢失时无需通知任何人，甚至是受害者本人。",
      ai: { backbone: "主句主语 American firms、谓语 did not have to tell、宾语 anyone；when 引导时间状语从句", structure: ["时间状语从句 Until California recently passed a law：说明加州立法前的状况","方式状语 even the victim：强调连受害者都不必告知","时间状语从句 when data went astray：说明数据出错时"], collocations: ["pass a law（通过法律）","have to tell（必须告知）","data goes astray（数据出错/丢失）"] }},
    { num: "③", en: "That may change fast: lots of proposed data-security legislation is now doing the rounds in Washington, D.C. Meanwhile, the theft of information about some 40 million credit-card accounts in America, disclosed on th June 17 , overshadowed a hugely important decision a day earlier by America’s Federal Trade Commission (FTC) that puts corporate America on notice that regulators will act if firms fail to provide adequate data security.", ref: "这种情况可能很快就会改变：大量有关数据安全的立法提案正在国会接受审议。与此同时，美国 6 月 17 日披露的一起涉及大约 4000 万信用卡账户的信息失窃案，又使得美国联邦贸易委员会头一天（16 日）做出的一项极为重大的决议——该决议警告美国商界，如果公司不能充分保障数据的安全，那么监管机构就会采取措施——颜面尽失。",
      ai: { backbone: "主语 That、谓语 may change、宾语 fast；冒号后为解释；Meanwhile 引出第二分句", structure: ["冒号后的独立分句 lots of proposed data-security legislation is now doing the rounds in Washington, D.C.：解释变化之快","副词 Meanwhile：引出同时发生的另一事件","分句2 主语 the theft of information about some 40 million credit-card accounts、谓语 overshadowed、宾语 a hugely important decision","过去分词短语 disclosed on June 17：作后置定语，修饰 theft","定语从句 that puts corporate America on notice：修饰 decision","宾语从句 that regulators will act if firms fail to provide adequate data security：作 on notice 的补足说明"], collocations: ["may change fast（可能迅速改变）","proposed legislation（拟议中的立法）","do the rounds（流传，四处传播）","credit-card accounts（信用卡账户）","overshadow（使黯然失色，盖过）","put sb on notice（警告某人）","adequate data security（充分的数据安全）"] }}
    ]
  },
  {
    day: 54,
    type: "英一",
    source: "2008 Text 1",
    zh: "尽管女性在现代生活中的不少领城仍在努力追赶男性，但至少在一个不利的方面女性似乎遥遥领先。据纽约退伍军人管理医院精神科主任医师耶胡达博士称，“相比男性，女性在应对压力时特别容易患抑郁症和焦虑症”。对动物和人的研究都表明性激素会以某种方式影响压力反应，导致处于压力下的雌性比处于同等条件下的雄性分泌更多触发不良反应的化学物质。其中几项研究显示，如果将承受巨大压力的雌鼠的卵巢（雌性生殖器官）切除，她们的化学反应变得和雄鼠相当。",
    sentences: [
    { num: "①", en: "While still catching-up to men in some spheres of modern life, women appear to be way ahead in at least one undesirable category.", ref: "尽管女性在现代生活中的不少领城仍在努力追赶男性，但至少在一个不利的方面女性似乎遥遥领先。",
      ai: { backbone: "主语 women、系动词 appear to be、表语 way ahead；句首为 While 让步状语从句", structure: ["让步状语从句 While still catching-up to men in some spheres of modern life：说明尽管在部分领域追赶男性","介词短语 in at least one undesirable category：说明领先的领域"], collocations: ["catch up to（赶上）","in some spheres of（在某些领域）","way ahead（遥遥领先）","undesirable category（不受欢迎的类别）"] }},
    { num: "②", en: "“Women are particularly susceptible to developing depression and anxiety disorders in response to stress compared to men,” according to Dr. Yehuda, chief psychiatrist at New York’s Veteran’s Administration Hospital.", ref: "据纽约退伍军人管理医院精神科主任医师耶胡达博士称，“相比男性，女性在应对压力时特别容易患抑郁症和焦虑症”。",
      ai: { backbone: "主语 Women、谓语 are susceptible to developing、宾语 depression and anxiety disorders；according to 引出处", structure: ["程度副词 particularly：强调易感程度","介词短语 in response to stress：说明应激背景","比较结构 compared to men：与男性对比","同位语 chief psychiatrist at New York's Veteran's Administration Hospital：说明 Dr. Yehuda 身份"], collocations: ["be susceptible to（易受……影响）","depression and anxiety disorders（抑郁症与焦虑症）","in response to（作为对……的反应）","compared to（与……相比）"] }},
    { num: "③", en: "Studies of both animals and humans have shown that sex hormones somehow affect the stress response, causing females under stress to produce more of the trigger chemicals than do males under the same conditions.", ref: "对动物和人的研究都表明性激素会以某种方式影响压力反应，导致处于压力下的雌性比处于同等条件下的雄性分泌更多触发不良反应的化学物质。",
      ai: { backbone: "主语 Studies、谓语 have shown、宾语从句 that sex hormones somehow affect the stress response", structure: ["后置定语 of both animals and humans：说明研究对象","宾语从句 that sex hormones somehow affect the stress response：作 shown 的宾语","现在分词短语 causing females under stress to produce more of the trigger chemicals：作结果状语","比较结构 than do males under the same conditions：比较两性反应"], collocations: ["sex hormones（性激素）","affect the stress response（影响应激反应）","trigger chemicals（触发化学物质）","under the same conditions（在相同条件下）"] }},
    { num: "④", en: "In several of the studies, when stressed-out female rats had their ovaries (the female reproductive organs) removed, their chemical responses became equal to those of the males.", ref: "其中几项研究显示，如果将承受巨大压力的雌鼠的卵巢（雌性生殖器官）切除，她们的化学反应变得和雄鼠相当。",
      ai: { backbone: "主语 their chemical responses、系动词 became、表语 equal to those of the males；when 引导时间状语从句", structure: ["时间状语从句 when stressed-out female rats had their ovaries removed：说明实验条件","括号说明 the female reproductive organs：解释 ovaries","介词短语 to those of the males：说明对比对象"], collocations: ["stressed-out（压力过大的）","have sth removed（将……摘除）","be equal to（等同于）","reproductive organs（生殖器官）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "spheren.范围，领域", word: "sphere", meaning: "n.范围，领域" },
      { raw: "wayadv.远远地，大大地", word: "way", meaning: "adv.远远地，大大地" },
      { raw: "undesirableadj.不受欢迎的，不良的", word: "undesirable", meaning: "adj.不受欢迎的，不良的" },
      { raw: "categoryn.种类，范畴", word: "category", meaning: "n.种类，范畴" },
      { raw: "catchupto追赶上", word: "catchupto追赶上", meaning: "" },
      { raw: "wayahead遥遥领先", word: "wayahead遥遥领先", meaning: "" }
    ],
        split: "Whilestillcatching-uptomen//insomespheres//ofmodernlife,//women appeartobewayahead//in(atleast)oneundesirablecategory.",
        grammar: ["主干：主+系+表", "catchupto追赶上", "wayahead遥遥领先(wayadv.远远地，大大地)", "同义替换思维sphere=category", "while引导状语从句(有省略whilewomenarestilldoingsth.=whiledoingsth.)"],
        ref: "尽管女性在现代生活中的不少领域仍在努力追赶男性，但至少在一个不利的方面女性似乎遥遥领先。"
      },
      {
        sentNum: "③",
        vocab: [
      { raw: "somehowadv.以某种方式", word: "somehow", meaning: "adv.以某种方式" },
      { raw: "responsen.回应，反应", word: "response", meaning: "n.回应，反应" },
      { raw: "triggern.诱因v.引发", word: "trigger", meaning: "n.诱因v.引发" },
      { raw: "sexhormones性激素", word: "sexhormones性激素", meaning: "" },
      { raw: "stressresponse压力反应", word: "stressresponse压力反应", meaning: "" }
    ],
        split: "Studies//ofbothanimalsandhumanshaveshown//thatsexhormonessomehow affectthestressresponse,//causingfemales//understress//toproducemoreofthe triggerchemicals//thandomales//underthesameconditions.",
        grammar: ["主干：主+谓+宾从", "more...than...比较结构：domales为省略倒装结构，完整形式为producemoreofthe", "triggerchemicalsthanmalesproducetriggerchemicals，do替代与主句相同的谓语", "部分，省略后为producemoreofthetriggerchemicalsthanmalesdo。"],
        ref: "动物和人的研究都表明性激素会以某种方式影响压力反应，导致处于压力下的雌性比处于同等条件下的雄性分泌更多触发不良反应的化学物质。"
      }
    ]
  },
  {
    day: 55,
    type: "英一",
    source: "2008 Text 1",
    zh: "加重女性更多压力化学物质剂量的，是她们增多的压力“机会”。耶胡达博士说“未必是女性不能同样地应付压力。只是她们不得不应付多得多的压力。她说道，“女性忍受压力的能力甚至可能超过男性，只是她们需要应付如此之多的事，以致她们精疲力竭得更明显且更快。耶胡达博士还提到两性间的另一种差别。“我认为女性面临的各种事情往往更具长期性或反复性。男性去打仗，面临的是战斗压力。他们面临更多的是偶尔的身体上的暴力行为。女性面临的各种人际间暴力往往是在家庭环境中，不幸的是这种暴力来自于父母或其他家庭成员，而且往往不是一次了事。这些长久关系带来的折磨可能是极具毁灭性的”。",
    sentences: [
    { num: "①", en: "Adding to a woman’s increased dose of stress chemicals, are her increased “opportunities” for stress.", ref: "加重女性更多压力化学物质剂量的，是她们增多的压力“机会”。",
      ai: { backbone: "倒装句：表语 Adding to a woman's increased dose of stress chemicals 前置，主语 her increased “opportunities” for stress、系动词 are", structure: ["介词短语 Adding to a woman's increased dose of stress chemicals：倒装前置的表语部分","介词短语 for stress：说明机会指向","分词短语 Adding to...：表示在原有基础上叠加"], collocations: ["add to（增加）","a dose of stress chemicals（一剂应激化学物质）","opportunities for stress（承受压力的机会）"] }},
    { num: "②", en: "“It’s not necessarily that women don’t cope as well.", ref: "耶胡达博士说“未必是女性不能同样地应付压力。",
      ai: { backbone: "主语 it、系动词 is not、表语 necessarily that women don't cope as well", structure: ["副词 necessarily：说明并非必然","表语从句 that women don't cope as well：说明否认的内容","比较结构 as well：与男性比较应对能力"], collocations: ["not necessarily（未必，不一定）","cope（应对）","as well（一样好）"] }},
    { num: "③", en: "It’s just that they have so much more to cope with,” says Dr. Yehuda.", ref: "只是她们不得不应付多得多的压力。",
      ai: { backbone: "主语 it、系动词 is、表语 that they have so much more to cope with；后接引述句", structure: ["表语从句 that they have so much more to cope with：说明原因","不定式短语 to cope with：作后置定语，修饰 much","引述句 says Dr. Yehuda：交代出处"], collocations: ["so much more（多得多）","cope with（应对）"] }},
    { num: "④", en: "“Their capacity for tolerating stress may even be greater than men’s,” she observes, “it’s just that they’re dealing with so many more things that they become worn out from it more visibly and sooner.”", ref: "她说道，“女性忍受压力的能力甚至可能超过男性，只是她们需要应付如此之多的事，以致她们精疲力竭得更明显且更快。",
      ai: { backbone: "主语 Their capacity for tolerating stress、系动词 may even be、表语 greater than men's；后接并列观察句", structure: ["介词短语 for tolerating stress：作 capacity 的后置定语","比较结构 greater than men's：与男性对比","引述 she observes：交代出处","后句 it's just that they're dealing with so many more things...：解释为何更易疲惫","结果状语从句 that they become worn out from it more visibly and sooner：说明疲惫结果"], collocations: ["capacity for tolerating（承受……的能力）","deal with（处理，应对）","wear out（疲惫不堪）","more visibly and sooner（更明显、更快地）"] }},
    { num: "⑤", en: "Dr. Yehuda notes another difference between the sexes.", ref: "耶胡达博士还提到两性间的另一种差别。",
      ai: { backbone: "主语 Dr. Yehuda、谓语 notes、宾语 another difference", structure: ["介词短语 between the sexes：说明差异的双方"], collocations: ["note a difference（指出差异）","between the sexes（两性之间）"] }},
    { num: "⑥", en: "“I think that the kinds of things that women are exposed to tend to be in more of a chronic or repeated nature.", ref: "“我认为女性面临的各种事情往往更具长期性或反复性。",
      ai: { backbone: "主语 the kinds of things、系动词 tend to be、表语 in more of a chronic or repeated nature", structure: ["宾语从句 that women are exposed to：作后置定语，修饰 things","介词短语 in more of a chronic or repeated nature：说明性质"], collocations: ["be exposed to（暴露于……）","a chronic or repeated nature（慢性或反复的性质）"] }},
    { num: "⑦", en: "Men go to war and are exposed to combat stress.", ref: "男性去打仗，面临的是战斗压力。",
      ai: { backbone: "主语 Men、谓语 go、介词短语 to war 作状语；and 连接第二谓语", structure: ["并列谓语 go to war and are exposed to combat stress：说明男性经历"], collocations: ["go to war（上战场）","combat stress（战斗应激）"] }},
    { num: "⑧", en: "Men are exposed to more acts of random physical violence.", ref: "他们面临更多的是偶尔的身体上的暴力行为。",
      ai: { backbone: "主语 Men、谓语 are exposed to、宾语 more acts of random physical violence", structure: ["比较结构 more...：与女性比较","介词短语 of random physical violence：说明暴力类型"], collocations: ["be exposed to（暴露于……）","random physical violence（随机人身暴力）"] }},
    { num: "⑨", en: "The kinds of interpersonal violence that women are exposed to tend to be in domestic situations, by, unfortunately, parents or other family members, and they tend not to be one-shot deals.", ref: "女性面临的各种人际间暴力往往是在家庭环境中，不幸的是这种暴力来自于父母或其他家庭成员，而且往往不是一次了事。",
      ai: { backbone: "主语 The kinds of interpersonal violence、谓语 tend to be、介词短语 in domestic situations 作表语；后接并列分句", structure: ["定语从句 that women are exposed to：修饰 violence","插入语 unfortunately：表达遗憾语气","介词短语 by parents or other family members：说明施暴者","并列谓语 they tend not to be one-shot deals：说明并非一次性事件"], collocations: ["interpersonal violence（人际暴力）","domestic situations（家庭情境）","one-shot deals（一次性事件）"] }},
    { num: "⑩", en: "The wear-and-tear that comes from these longer relationships can be quite devastating.”", ref: "这些长久关系带来的折磨可能是极具毁灭性的”。",
      ai: { backbone: "主语 The wear-and-tear、系动词 can be、表语 quite devastating；后接定语从句", structure: ["定语从句 that comes from these longer relationships：修饰 wear-and-tear，说明来源","程度副词 quite：加强语气"], collocations: ["wear-and-tear（磨损，损耗）","devastating（毁灭性的）","longer relationships（更长久的关系）"] }}
    ]
  },
  {
    day: 56,
    type: "英一",
    source: "2008 Text 1",
    zh: "阿德琳·阿尔瓦雷兹十八岁结婚并生有一子，但她却坚决要完成大学学业。“为了拿到大学文凭我拼命努力。我的生活极其不如意，以至于我只有通过上学、取得进步并做得更好以摆脱现实困境。后来，她的婚姻结束，她成了单身母亲。“照顾一个十来岁的孩子、工作、交房租、付车款、还要偿还债务，这是最辛苦的事情。我过着勉强糊口的生活。并不是每个人都承受着阿德琳·阿尔瓦雷兹描述的这种巨大的长期性压力。但如今大多数女性都担负着许多责任，几乎没有放松的时候，因此感到焦虑。阿尔瓦雷兹的经历说明在压力威胁到你的健康和身体机能之前寻求途径缓解压力是相当重要的。",
    sentences: [
    { num: "①", en: "Adeline Alvarez married at 18 and gave birth to a son, but was determined to finish college.", ref: "阿德琳·阿尔瓦雷兹十八岁结婚并生有一子，但她却坚决要完成大学学业。",
      ai: { backbone: "主语 Adeline Alvarez、谓语 married at 18 and gave birth to a son；but 连接第二谓语", structure: ["并列谓语 married at 18 and gave birth to a son：概述早年经历","转折连词 but 与 was determined to finish college：说明其坚持求学的决心"], collocations: ["get married（结婚）","give birth to（生下）","be determined to（决心……）","finish college（完成大学学业）"] }},
    { num: "②", en: "“I struggled a lot to get the college degree.", ref: "“为了拿到大学文凭我拼命努力。",
      ai: { backbone: "主语 I、谓语 struggled、程度状语 a lot；不定式作目的状语", structure: ["不定式短语 to get the college degree：作目的状语"], collocations: ["struggle a lot（非常艰难）","get the college degree（取得大学学位）"] }},
    { num: "③", en: "I was living in so much frustration that that was my escape, to go to school, and get ahead and do better.”", ref: "我的生活极其不如意，以至于我只有通过上学、取得进步并做得更好以摆脱现实困境。",
      ai: { backbone: "主语 I、谓语 was living、介词短语 in so much frustration 作状语；that 引导结果状语从句", structure: ["结果状语从句 that that was my escape：说明沮丧之深","不定式短语 to go to school, and get ahead and do better：对 escape 作同位解释"], collocations: ["live in frustration（生活在挫败中）","so much...that（如此……以至于）","get ahead（取得成功）"] }},
    { num: "④", en: "Later, her marriage ended and she became a single mother.", ref: "后来，她的婚姻结束，她成了单身母亲。",
      ai: { backbone: "主语 her marriage、谓语 ended；and 连接第二分句", structure: ["时间状语 Later：说明时间","第二分句 she became a single mother：说明身份转变"], collocations: ["marriage ends（婚姻结束）","a single mother（单亲妈妈）"] }},
    { num: "⑤", en: "“It’s the hardest thing to take care of a teenager, have a job, pay the rent, pay the car payment, and pay the debt.", ref: "“照顾一个十来岁的孩子、工作、交房租、付车款、还要偿还债务，这是最辛苦的事情。",
      ai: { backbone: "主语 It、系动词 is、表语 the hardest thing；不定式短语作真正主语", structure: ["不定式短语 to take care of a teenager, have a job, pay the rent, pay the car payment, and pay the debt：作真正主语，并列列举多重负担"], collocations: ["take care of（照顾）","pay the rent（付房租）","car payment（车贷）"] }},
    { num: "⑥", en: "I lived from paycheck to paycheck.”", ref: "我过着勉强糊口的生活。",
      ai: { backbone: "主语 I、谓语 lived、介词短语 from paycheck to paycheck 作状语", structure: ["介词短语 from paycheck to paycheck：说明财务拮据、月月光"], collocations: ["live from paycheck to paycheck（月光，靠薪水度日）"] }},
    { num: "⑦", en: "Not everyone experiences the kinds of severe chronic stresses Alvarez describes.", ref: "并不是每个人都承受着阿德琳·阿尔瓦雷兹描述的这种巨大的长期性压力。",
      ai: { backbone: "主语 Not everyone、谓语 experiences、宾语 the kinds of severe chronic stresses", structure: ["定语从句 Alvarez describes：修饰 stresses，说明是 Alvarez 所描述的那种","后置定语 of severe chronic stresses：说明压力类型"], collocations: ["severe chronic stresses（严重的慢性压力）","not everyone（并非所有人）"] }},
    { num: "⑧", en: "But most women today are coping with a lot of obligations, with few breaks, and feeling the strain.", ref: "但如今大多数女性都担负着许多责任，几乎没有放松的时候，因此感到焦虑。",
      ai: { backbone: "主语 most women、谓语 are coping with、宾语 a lot of obligations；and 连接第二谓语", structure: ["转折连词 But：承上启下","时间状语 today：点明当下","介词短语 with few breaks：说明休息甚少","现在分词短语 feeling the strain：作伴随状语"], collocations: ["cope with（应对）","a lot of obligations（大量责任）","feel the strain（感到压力）"] }},
    { num: "⑨", en: "Alvarez’s experience demonstrates the importance of finding ways to diffuse stress before it threatens your health and your ability to function.", ref: "阿尔瓦雷兹的经历说明在压力威胁到你的健康和身体机能之前寻求途径缓解压力是相当重要的。",
      ai: { backbone: "主语 Alvarez's experience、谓语 demonstrates、宾语 the importance；of 引导后置定语", structure: ["介词短语 of finding ways to diffuse stress：作 importance 的后置定语","时间状语从句 before it threatens your health and your ability to function：说明时机"], collocations: ["demonstrate the importance of（表明……的重要性）","diffuse stress（缓解压力）","ability to function（正常运作的能力）"] }}
    ]
  },
  {
    day: 57,
    type: "英一",
    source: "2008 Text 2",
    zh: "它曾是如此直接。在实验室通力合作的一组研究人员将他们的研究成果呈递给一份期刊。之后该期刊的某位编辑会隐去论文上作者的名字和所属机构，并送交同行专家评审。该编辑会根据收到的（专家）意见来决定是否同意发表该论文。论文的版权归属于期刊出版商，想要查询该研究成果相关信息的研究者不得不订阅该期刊。",
    sentences: [
    { num: "①", en: "It used to be so straightforward.", ref: "它曾是如此直接。",
      ai: { backbone: "主语 it、系动词 used to be、表语 so straightforward", structure: ["情态结构 used to：表示过去的常态","表语 so straightforward：说明过去流程简单直接"], collocations: ["used to be（过去曾经是）","straightforward（简单直接的）"] }},
    { num: "②", en: "A team of researchers working together in the laboratory would submit the results of their research to a journal.", ref: "在实验室通力合作的一组研究人员将他们的研究成果呈递给一份期刊。",
      ai: { backbone: "主语 A team of researchers、谓语 would submit、宾语 the results", structure: ["现在分词短语 working together in the laboratory：作后置定语，修饰 researchers","介词短语 to a journal：说明提交对象","后置定语 of their research：修饰 results"], collocations: ["a team of researchers（研究团队）","submit...to...（把……提交给……）","in the laboratory（在实验室）"] }},
    { num: "③", en: "A journal editor would then remove the author’s names and affiliations from the paper and send it to their peers for review.", ref: "之后该期刊的某位编辑会隐去论文上作者的名字和所属机构，并送交同行专家评审。",
      ai: { backbone: "主语 A journal editor、谓语 would remove、宾语 the author's names and affiliations；and 连接第二谓语", structure: ["时间状语 then：说明流程顺序","介词短语 from the paper：说明移除的对象","第二谓语 send it to their peers for review：说明送审流程"], collocations: ["remove...from...（从……中移除）","send to peers（送交同行）","for review（供评审）"] }},
    { num: "④", en: "Depending on the comments received, the editor would accept the paper for publication or decline it.", ref: "该编辑会根据收到的（专家）意见来决定是否同意发表该论文。",
      ai: { backbone: "主语 the editor、谓语 would accept、宾语 the paper for publication or decline it；Depending on 作状语", structure: ["介词短语 Depending on the comments received：作条件状语，说明依据","过去分词短语 received：作后置定语，修饰 comments","并列谓语 accept...or decline it：说明两种可能"], collocations: ["depending on（取决于）","accept for publication（接受发表）","decline（拒绝）"] }},
    { num: "⑤", en: "Copyright rested with the journal publisher, and researchers seeking knowledge of the results would have to subscribe to the journal.", ref: "论文的版权归属于期刊出版商，想要查询该研究成果相关信息的研究者不得不订阅该期刊。",
      ai: { backbone: "and 连接两个并列分句：分句1 主语 Copyright、谓语 rested with、宾语 the journal publisher；分句2 主语 researchers、谓语 would have to subscribe", structure: ["介词短语 with the journal publisher：说明版权的归属方","现在分词短语 seeking knowledge of the results：作后置定语，修饰 researchers","不定式短语 to subscribe to the journal：作宾语，说明须订阅刊物"], collocations: ["rest with（归属于）","journal publisher（期刊出版商）","subscribe to（订阅）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "copyrightn.版权", word: "copyright", meaning: "n.版权" },
      { raw: "publishern.出版商", word: "publisher", meaning: "n.出版商" },
      { raw: "restwith在于，由...负责", word: "restwith在于，由...负责", meaning: "" },
      { raw: "seekknowledgeof...想要知道", word: "seekknowledgeof...想要知道", meaning: "" },
      { raw: "subscribeto订阅", word: "subscribeto订阅", meaning: "" }
    ],
        split: "Copyrightrestedwiththejournalpublisher,//andresearchers//seeking knowledgeoftheresultswouldhavetosubscribetothejournal.",
        grammar: ["主干：主+谓+宾（并列结构）", "restwith在于，由...负责", "seekingknowledgeof...想要知道（在本句中作后置定语修饰researchers）", "注意本句暗含因果关系"],
        ref: "论文的版权归属于期刊出版商，想要查询该研究成果相关信息的研究者不得不订阅该期刊。"
      }
    ]
  },
  {
    day: 58,
    type: "英一",
    source: "2008 Text 2",
    zh: "（情形）不再如此。因特网——以及来自资助机构的压力，这些机构质问，商业出版商为什么通过限制科研成果的获取从政府资助的研究项目中获利——正在使自由获取科研成果成为现实。经济合作与发展组织（OECD）刚刚发布了一份报告阐述了这一变化的深远影响。这篇由澳大利亚维多利亚大学的约翰·霍顿和 OECD 的格雷厄姆·维克利共同撰写的报告，让那些迄今为止赚取了丰厚利润的出版商读起来心情沉重。但其意义不止于此，它还标志着科学探索目前为止的一个关键要素发生的一种变化。",
    sentences: [
    { num: "①", en: "No longer.", ref: "（情形）不再如此。",
      ai: { backbone: "省略句：No longer，省略主谓，承上表示情况不复存在", structure: ["该句为省略句，仅保留时间状语 No longer，强调上述流程已成历史"], collocations: ["no longer（不再）"] }},
    { num: "②", en: "The Internet—and pressure from funding agencies, who are questioning why commercial publishers are making money from government-funded research by restricting access to it—is making access to scientific results a reality.", ref: "因特网——以及来自资助机构的压力，这些机构质问，商业出版商为什么通过限制科研成果的获取从政府资助的研究项目中获利——正在使自由获取科研成果成为现实。",
      ai: { backbone: "主语 The Internet—and pressure from funding agencies—、谓语 is making、宾语 access、宾补 a reality；破折号内为插入语", structure: ["破折号内的并列主语 and pressure from funding agencies：补充说明压力来源","非限制性定语从句 who are questioning why commercial publishers are making money...：修饰 funding agencies","宾语从句 why commercial publishers are making money from government-funded research：作 questioning 的宾语","现在分词短语 by restricting access to it：说明牟利方式","介词短语 to scientific results：修饰 access，说明访问对象"], collocations: ["pressure from（来自……的压力）","funding agencies（资助机构）","commercial publishers（商业出版商）","government-funded research（政府资助的研究）","make money from（从……牟利）","restrict access to（限制……的获取）"] }},
    { num: "③", en: "The Organization for Economic Co-operation and Development (OECD) has just issued a report describing the far-reaching consequences of this.", ref: "经济合作与发展组织（OECD）刚刚发布了一份报告阐述了这一变化的深远影响。",
      ai: { backbone: "主语 The Organization for Economic Co-operation and Development (OECD)、谓语 has issued、宾语 a report；现在分词作后置定语", structure: ["时间状语 just：表示刚刚","现在分词短语 describing the far-reaching consequences of this：作后置定语，修饰 report"], collocations: ["issue a report（发布报告）","far-reaching consequences（深远的影响）"] }},
    { num: "④", en: "The report, by John Houghton of Victoria University in Australia and Graham Vickery of the OECD, makes heavy reading for publishers who have, so far, made handsome profits.", ref: "这篇由澳大利亚维多利亚大学的约翰·霍顿和 OECD 的格雷厄姆·维克利共同撰写的报告，让那些迄今为止赚取了丰厚利润的出版商读起来心情沉重。",
      ai: { backbone: "主语 The report、谓语 makes、宾语 heavy reading for publishers；后接定语从句", structure: ["介词短语 by John Houghton...and Graham Vickery...：说明报告作者","同位语 of Victoria University in Australia / of the OECD：说明作者所属机构","定语从句 who have, so far, made handsome profits：修饰 publishers，说明其此前获利丰厚"], collocations: ["heavy reading（令人心情沉重的读物）","handsome profits（丰厚的利润）","so far（迄今为止）"] }},
    { num: "⑤", en: "But it goes further than that. It signals a change in what has, until now, been a key element of scientific endeavor.", ref: "但其意义不止于此，它还标志着科学探索目前为止的一个关键要素发生的一种变化。",
      ai: { backbone: "主语 it、谓语 goes、程度状语 further；but 连接转折；分句2 主语 it、谓语 signals、宾语 a change", structure: ["转折连词 But：说明更进一步","介词短语 in what has, until now, been a key element of scientific endeavor：说明变化发生的领域，其中 what 引导宾语从句"], collocations: ["go further（更进一步）","signal a change（标志一种变化）","scientific endeavor（科学事业）"] }}
    ]
  },
  {
    day: 59,
    type: "英一",
    source: "2008 Text 2",
    zh: "知识的价值以及科研公共投资的回报某种程度上取决于其广泛的传播和容易的获取。这是门大生意。在美国，核心科学出版市场的估值在 70 亿到 110 亿美元之间。国际科学、技术和医学出版商协会称，全球有超过 2000 家出版公司专门从事这些学科（科学、技术和医学）的出版，它们每年在近 16,000 种期刊中刊登超过 120 万篇论文。",
    sentences: [
    { num: "①", en: "The value of knowledge and the return on the public investment in research depends, in part, upon wide distribution and ready access.", ref: "知识的价值以及科研公共投资的回报某种程度上取决于其广泛的传播和容易的获取。",
      ai: { backbone: "主语 The value of knowledge and the return on the public investment、谓语 depends、介词短语 in part upon wide distribution and ready access 作状语", structure: ["介词短语 on the public investment：作 return 的后置定语","介词短语 in part：说明部分程度","介词短语 upon wide distribution and ready access：说明依赖对象"], collocations: ["the value of knowledge（知识的价值）","public investment（公共投资）","in part（部分地）","wide distribution（广泛传播）","ready access（便捷获取）"] }},
    { num: "②", en: "It is big business.", ref: "这是门大生意。",
      ai: { backbone: "主语 It、系动词 is、表语 big business", structure: ["该句结构简单，无明显修饰成分"], collocations: ["big business（大生意，庞大的产业）"] }},
    { num: "③", en: "In America, the core scientific publishing market is estimated at between $7 billion and $11 billion.", ref: "在美国，核心科学出版市场的估值在 70 亿到 110 亿美元之间。",
      ai: { backbone: "主语 the core scientific publishing market、谓语 is estimated、介词短语 at between $7 billion and $11 billion 作补语", structure: ["地点状语 In America：限定范围","介词短语 at between $7 billion and $11 billion：说明估值区间"], collocations: ["scientific publishing market（科学出版市场）","be estimated at（估计为）","core（核心的）"] }},
    { num: "④", en: "The International Association of Scientific, Technical and Medical Publishers says that there are more than 2,000 publishers worldwide specializing in these subjects. They publish more than 1.2 million articles each year in some 16,000 journals.", ref: "国际科学、技术和医学出版商协会称，全球有超过 2000 家出版公司专门从事这些学科（科学、技术和医学）的出版，它们每年在近 16,000 种期刊中刊登超过 120 万篇论文。",
      ai: { backbone: "主语 The International Association...、谓语 says、宾语从句 there are more than 2,000 publishers", structure: ["宾语从句 there are more than 2,000 publishers worldwide...：作 says 的宾语","现在分词短语 specializing in these subjects：作后置定语，修饰 publishers","后一句 They publish more than 1.2 million articles each year in some 16,000 journals：补充说明出版规模"], collocations: ["specialize in（专攻，专门从事）","publish articles（发表论文）","scientific, technical and medical（科技与医学的）"] }}
    ]
  },
  {
    day: 60,
    type: "英一",
    source: "2008 Text 2",
    zh: "这一情形如今正在改变。根据 OECD 的这份报告，目前已有约 75%的学术期刊上线。全新的商业模式正在涌现。报告作者明确指出了三种主要的模式。第一种是所谓的“大订单”模式，机构订户通过网站许可协议付费获取一大批网络期刊的（阅读）权限。第二种是开放存取出版，通常依靠作者（或其所属机构）支付论文出版费用。第三种是开放存取知识库，由大学或国际实验室这样的组织资助（建立）机构储存库。现有的其他模式是这三种的混合，如延期开放存取，即，期刊在（论文发表后的）前六个月只允许付费订阅者阅读论文，之后免费提供给所有想阅读的人。所有这一切可能会改变传统的同行评议程序，至少对于论文出版是如此。",
    sentences: [
    { num: "①", en: "This is now changing.", ref: "这一情形如今正在改变。",
      ai: { backbone: "主语 This、系动词 is、表语 now changing", structure: ["时间副词 now：点明当下的变化"], collocations: ["now changing（正在改变）"] }},
    { num: "②", en: "According to the OECD report, some 75% of scholarly journals are now online.", ref: "根据 OECD 的这份报告，目前已有约 75%的学术期刊上线。",
      ai: { backbone: "主语 some 75% of scholarly journals、系动词 are、表语 online；According to 作状语", structure: ["介词短语 According to the OECD report：说明依据","时间副词 now：说明当下状态"], collocations: ["scholarly journals（学术期刊）","according to（根据）"] }},
    { num: "③", en: "Entirely new business models are emerging;", ref: "全新的商业模式正在涌现。",
      ai: { backbone: "主语 Entirely new business models、谓语 are emerging", structure: ["该句结构简单，无明显修饰成分"], collocations: ["business models（商业模式）","entirely new（全新的）","emerge（涌现）"] }},
    { num: "④", en: "three main ones were identified by the report’s authors.", ref: "报告作者明确指出了三种主要的模式。",
      ai: { backbone: "主语 three main ones、谓语 were identified；by 引出施动者", structure: ["介词短语 by the report's authors：说明识别者"], collocations: ["be identified by（由……识别）","the report's authors（报告作者）"] }},
    { num: "⑤", en: "There is the so-called big deal, where institutional subscribers pay for access to a collection of online journal titles through site-licensing agreements.", ref: "第一种是所谓的“大订单”模式，机构订户通过网站许可协议付费获取一大批网络期刊的（阅读）权限。",
      ai: { backbone: "There be 结构，主语 the so-called big deal；where 引导非限制性定语从句", structure: ["非限制性定语从句 where institutional subscribers pay for access...：具体说明 big deal 模式","介词短语 through site-licensing agreements：说明付费方式","介词短语 to a collection of online journal titles：说明访问对象"], collocations: ["the so-called big deal（所谓的大宗交易）","institutional subscribers（机构订阅者）","site-licensing agreements（站点许可协议）","a collection of（一批，一系列）"] }},
    { num: "⑥", en: "There is open-access publishing, typically supported by asking the author (or\u0003his employer) to pay for the paper to be published.", ref: "第二种是开放存取出版，通常依靠作者（或其所属机构）支付论文出版费用。",
      ai: { backbone: "There be 结构，主语 open-access publishing；后接过去分词作后置定语", structure: ["过去分词短语 typically supported by asking the author...to pay：作后置定语，说明其运作方式","方式状语 typically：说明典型做法","括号说明 (or his employer)：补充付费主体","不定式短语 to pay for the paper to be published：说明付费用途"], collocations: ["open-access publishing（开放获取出版）","pay for（支付……的费用）","be published（被发表）"] }},
    { num: "⑦", en: "Finally, there are open-access archives, where organizations such as universities or international laboratories support institutional repositories.", ref: "第三种是开放存取知识库，由大学或国际实验室这样的组织资助（建立）机构储存库。",
      ai: { backbone: "There be 结构，主语 open-access archives；where 引导非限制性定语从句", structure: ["非限制性定语从句 where organizations...support institutional repositories：说明档案模式","时间副词 Finally：表示最后一种模式","介词短语 such as universities or international laboratories：举例说明机构类型"], collocations: ["open-access archives（开放获取档案库）","institutional repositories（机构知识库）","international laboratories（国际实验室）"] }},
    { num: "⑧", en: "Other models exist that are hybrids of these three, such as delayed open-access, where journals allow only subscribers to read a paper for the first six months, before making it freely available to everyone who wishes to see it.", ref: "现有的其他模式是这三种的混合，如延期开放存取，即，期刊在（论文发表后的）前六个月只允许付费订阅者阅读论文，之后免费提供给所有想阅读的人。",
      ai: { backbone: "主语 Other models、谓语 exist；that 引导定语从句", structure: ["定语从句 that are hybrids of these three：修饰 models，说明其为混合模式","方式状语 such as delayed open-access：举例说明","非限制性定语从句 where journals allow only subscribers to read a paper...：说明延迟开放模式","时间状语 for the first six months：说明限制期","时间状语 before making it freely available...：说明之后免费开放","定语从句 who wishes to see it：修饰 everyone"], collocations: ["hybrids of（……的混合体）","delayed open-access（延迟开放获取）","freely available（免费提供）"] }},
    { num: "⑨", en: "All this could change the traditional form of the peer-review process, at least for the publication of papers.", ref: "所有这一切可能会改变传统的同行评议程序，至少对于论文出版是如此。",
      ai: { backbone: "主语 All this、谓语 could change、宾语 the traditional form of the peer-review process", structure: ["时间状语 at least：表示最低程度","介词短语 for the publication of papers：说明适用范围"], collocations: ["peer-review process（同行评审流程）","the traditional form（传统形式）","the publication of papers（论文发表）"] }}
    ],
    analysis: [
      {
        sentNum: "⑧",
        vocab: [
      { raw: "modeln.模式", word: "model", meaning: "n.模式" },
      { raw: "existv.存在", word: "exist", meaning: "v.存在" },
      { raw: "hybridn.混合物", word: "hybrid", meaning: "n.混合物" },
      { raw: "subscribern.订阅者", word: "subscriber", meaning: "n.订阅者" }
    ],
        split: "Othermodelsexist//thatarehybrids//ofthesethree,//suchasdelayed open-access,//wherejournalsallowonlysubscribers//toreadapaper//forthefirstsix months,//beforemakingitfreelyavailabletoeveryone//whowishestoseeit.",
        grammar: ["主干：主+谓", "that引导定语从句（限定othermodels）", "where引导定语从句（限定open-access）", "who引导定语从句（限定everyone）", "that引导定语从句，限定othermodels（注意定语从句的隔离结构）", "before的翻译（注意复习2006Text4这部分知识点讲解）"],
        ref: "现有的其他模式是这三种的混合，如延期开放存取，即期刊在（论文发表后的）前六个月只允许付费订阅者阅读论文，之后免费提供给所有想阅读的人。"
      }
    ]
  },
  {
    day: 61,
    type: "英一",
    source: "2008 Text 3",
    zh: "20 世纪 60 年代初，威尔特·张伯伦是被列入全国篮球协会（NBA）超过七英尺的仅有三名球员之一。然而，假若上个赛季他还在打球的话，他就会是 42 名这样的球员中的一员了。多年以来，从事主要职业运动的运动员身材发生了显著变化，经理们一直在欣然调整队服，以适合越来越多更大更高的身躯。",
    sentences: [
    { num: "①", en: "In the early 1960s Wilt Chamberlain was one of the only three players in the National Basketball Association (NBA) listed at over seven feet.", ref: "20 世纪 60 年代初，威尔特·张伯伦是被列入全国篮球协会（NBA）超过七英尺的仅有三名球员之一。",
      ai: { backbone: "主语 Wilt Chamberlain、谓语 was、表语 one of the only three players；时间状语 In the early 1960s", structure: ["时间状语 In the early 1960s：修饰整个主句，说明事件发生的时间","介词短语 in the National Basketball Association (NBA)：作后置定语，修饰 players，限定其所在联盟","过去分词短语 listed at over seven feet：作后置定语，修饰 players，说明这些球员身高超过七英尺"], collocations: ["one of the only three（仅有的三位之一）","be listed at（被列为，身高登记为）","over seven feet（超过七英尺）"] }},
    { num: "②", en: "If he had played last season, however, he would have been one of 42.", ref: "然而，假若上个赛季他还在打球的话，他就会是 42 名这样的球员中的一员了。",
      ai: { backbone: "主句：主语 he、谓语 would have been、表语 one of 42；条件从句：主语 he、谓语 had played", structure: ["条件状语从句 If he had played last season：与过去事实相反的虚拟条件句，说明主句成立的假设前提","插入语 however：表转折，连接上下文，说明与上文的对照","表语 one of 42：省略了前文提到的 players，指42名身高超七英尺的球员之一"], collocations: ["would have been（本会成为，虚拟语气）","last season（上个赛季）"] }},
    { num: "③", en: "The bodies playing major professional sports have changed dramatically over the years, and managers have been more than willing to adjust team uniforms to fit the growing numbers of bigger, longer frames.", ref: "多年以来，从事主要职业运动的运动员身材发生了显著变化，经理们一直在欣然调整队服，以适合越来越多更大更高的身躯。",
      ai: { backbone: "并列句：句1 主语 The bodies、谓语 have changed；句2 主语 managers、谓语 have been willing to adjust、宾语 team uniforms", structure: ["现在分词短语 playing major professional sports：作后置定语，修饰 The bodies，说明是从事职业体育的身体","时间状语 over the years：修饰 have changed，表示多年来的变化","形容词短语 more than willing to adjust team uniforms：作表语，说明管理层的态度","不定式短语 to fit the growing numbers of bigger, longer frames：作目的状语，说明调整队服的目的","介词短语 of bigger, longer frames：作后置定语，修饰 numbers"], collocations: ["major professional sports（职业体育项目）","more than willing（非常乐意）","adjust...to fit（调整……以适应）","growing numbers（日益增多的数量）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "adjustv.调整", word: "adjust", meaning: "v.调整" },
      { raw: "fitv.适应", word: "fit", meaning: "v.适应" },
      { raw: "framen.框架", word: "frame", meaning: "n.框架" },
      { raw: "morethan十分，非常", word: "morethan十分，非常", meaning: "" },
      { raw: "bewillingtodosth.愿意做某事", word: "bewillingtodosth.愿意做某事", meaning: "" }
    ],
        split: "Thebodies//playingmajorprofessionalsportshavechangeddramatically//over theyears,//andmanagershavebeenmorethanwillingtoadjustteamuniforms //tofitthegrowingnumbers//ofbigger,longerframes.",
        grammar: ["主干：主+谓+宾（并列结构）", "morethan十分，非常", "body=frame身体，身材，身躯（同义替换思维）"],
        ref: "多年以来，从事主要职业运动的运动员身材发生了显著变化，经理们一直在欣然调整队服，以适合越来越多更大更高的身躯。"
      }
    ]
  },
  {
    day: 62,
    type: "英一",
    source: "2008 Text 3",
    zh: "然而，体育界的这种趋势可能正在掩盖一个未被注意到的事实：美国人的身高总体上已停止增长。尽管比 140 年前普遍高约两英寸，但现在的美国人——尤其是那些出生于已在美国生活好几代的家庭中的美国人——在 20 世纪 60 年代初就明显已达身高极限。他们不大可能再有任何身高增长了。莱特州立大学的人类学家威廉·卡梅隆·查姆利称:“就当今总人群而言，在现有的基因和环境水平下，我们的身高几乎已达极限。至于 NBA 球员，他们身高的增长似乎是“从世界各地招募球员”这种日益普遍做法的结果。",
    sentences: [
    { num: "①", en: "The trend in sports, though, may be obscuring an unrecognized reality: Americans have generally stopped growing.", ref: "然而，体育界的这种趋势可能正在掩盖一个未被注意到的事实：美国人的身高总体上已停止增长。",
      ai: { backbone: "主语 The trend in sports、谓语 may be obscuring、宾语 an unrecognized reality；冒号后为同位语从句解释 reality", structure: ["插入语 though：表转折，连接上下文","介词短语 in sports：作后置定语，修饰 trend","冒号后的分句 Americans have generally stopped growing：作 reality 的同位语，解释其具体内容"], collocations: ["obscure a reality（掩盖一个现实）","generally（大体上，通常）","stop growing（停止生长）"] }},
    { num: "②", en: "Though typically about two inches taller now than 140 years ago, today’s people—especially those born to families who have lived in the U.S. for many generations—apparently reached their limit in the early 1960s.", ref: "尽管比 140 年前普遍高约两英寸，但现在的美国人——尤其是那些出生于已在美国生活好几代的家庭中的美国人——在 20 世纪 60 年代初就明显已达身高极限。",
      ai: { backbone: "主句：主语 today’s people、谓语 reached、宾语 their limit；让步状语从句 Though taller now than 140 years ago", structure: ["让步状语从句 Though typically about two inches taller now than 140 years ago：省略了主谓（they are），表示让步","破折号之间的插入语 especially those born to families who have lived in the U.S. for many generations：补充说明 today’s people 中特别的一类人","过去分词短语 born to families：作后置定语，修饰 those","定语从句 who have lived in the U.S. for many generations：修饰 families","时间状语 in the early 1960s：修饰 reached"], collocations: ["reach one’s limit（达到极限）","in the early 1960s（在20世纪60年代初）","for many generations（历经多代）"] }},
    { num: "③", en: "And they aren’t likely to get any taller.", ref: "他们不大可能再有任何身高增长了。",
      ai: { backbone: "主语 they、谓语 aren’t likely、表语 to get any taller", structure: ["不定式短语 to get any taller：作表语，说明可能的结果","比较级 any taller：意为“更高一些”"], collocations: ["be likely to do（很可能做某事）","get taller（长得更高）"] }},
    { num: "④", en: "“In the general population today, at this genetic, environmental level, we’ve pretty much gone as far as we can go,” says anthropologist William Cameron Chumlea of Wright State University.", ref: "莱特州立大学的人类学家威廉·卡梅隆·查姆利称:“就当今总人群而言，在现有的基因和环境水平下，我们的身高几乎已达极限。",
      ai: { backbone: "引语部分：主语 we、谓语 have gone、宾语 as far as we can go；主句：谓语 says、主语 anthropologist William Cameron Chumlea（倒装）", structure: ["引语内状语 in the general population today：说明范围和时间","介词短语 at this genetic, environmental level：说明在这一基因与环境水平上","宾语从句 as far as we can go：作 have gone 的比较状语从句","介词短语 of Wright State University：作后置定语，修饰 anthropologist"], collocations: ["general population（普通人群）","go as far as one can（走到尽头，达到极限）","at this level（在这一水平上）"] }},
    { num: "⑤", en: "In the case of NBA players, their increase in height appears to result from the increasingly common practice of recruiting players from all over the world.", ref: "至于 NBA 球员，他们身高的增长似乎是“从世界各地招募球员”这种日益普遍做法的结果。",
      ai: { backbone: "主语 their increase in height、谓语 appears to result from、宾语 the practice", structure: ["介词短语 In the case of NBA players：作状语，说明就NBA球员而言","介词短语 in height：作后置定语，修饰 increase","介词短语 of recruiting players from all over the world：作后置定语，修饰 practice","介词短语 from all over the world：作后置定语，修饰 players"], collocations: ["in the case of（就……而言）","result from（源于，由……导致）","recruit players（招募球员）","all over the world（全世界）"] }}
    ]
  },
  {
    day: 63,
    type: "英一",
    source: "2008 Text 3",
    zh: "身高增长需要热量和营养——尤其是蛋白质——以满足组织扩展的需求。人在 20 岁以后很少会继续长高了。20 世纪之初，营养不足和儿童传染病阻碍了身高的增长。然而，随着饮食和健康状况的改善，儿童和青少年的身高每 20 年平均增长约 1.5 英寸，这种模式被称为身高（增长）的长期趋势。然而根据疾病控制与预防中心的数据，平均身高——男性 5 英尺 9 英寸，女性 5 英尺 4 英寸——自 1960 年以来并未真正改变过。",
    sentences: [
    { num: "①", en: "Growth, which rarely continues beyond the age of 20, demands calories and nutrients—notably, protein—to feed expanding tissues.", ref: "身高增长需要热量和营养——尤其是蛋白质——以满足组织扩展的需求。人在 20 岁以后很少会继续长高了。",
      ai: { backbone: "主语 Growth、谓语 demands、宾语 calories and nutrients；目的状语 to feed expanding tissues", structure: ["非限制性定语从句 which rarely continues beyond the age of 20：修饰 Growth","破折号之间的插入语 notably, protein：补充说明 nutrients 中尤指蛋白质","不定式短语 to feed expanding tissues：作目的状语，说明需求的目的"], collocations: ["beyond the age of（超过……年龄）","demand calories and nutrients（需要热量和营养）","feed expanding tissues（供给生长的组织）"] }},
    { num: "②", en: "At the start of the 20th century, under-nutrition and childhood infections got in the way.", ref: "20 世纪之初，营养不足和儿童传染病阻碍了身高的增长。",
      ai: { backbone: "主语 under-nutrition and childhood infections、谓语 got in the way", structure: ["时间状语 At the start of the 20th century：说明发生的时间","并列主语 under-nutrition and childhood infections：两个并列的名词短语"], collocations: ["at the start of（在……开始时）","get in the way（妨碍，阻碍）","under-nutrition（营养不足）"] }},
    { num: "③", en: "But as diet and health improved, children and adolescents have, on average, increased in height by about an inch and a half every 20 years, a pattern known as the secular trend in height.", ref: "然而，随着饮食和健康状况的改善，儿童和青少年的身高每 20 年平均增长约 1.5 英寸，这种模式被称为身高（增长）的长期趋势。",
      ai: { backbone: "主句：主语 children and adolescents、谓语 have increased；时间状语从句 as diet and health improved", structure: ["时间状语从句 as diet and health improved：表示随着……而……","插入语 on average：作状语，表示平均而言","介词短语 in height：说明增加的方向","介词短语 by about an inch and a half every 20 years：说明增加的程度和频率","名词短语 a pattern known as the secular trend in height：作同位语，概括前文内容","过去分词短语 known as the secular trend in height：作后置定语，修饰 pattern"], collocations: ["on average（平均而言）","increase in height（身高增长）","the secular trend（长期趋势）","be known as（被称为）"] }},
    { num: "④", en: "Yet according to the Centers for Disease Control and Prevention, average height—5'9\" for men, 5'4\" for women—hasn’t really changed since 1960.", ref: "然而根据疾病控制与预防中心的数据，平均身高——男性 5 英尺 9 英寸，女性 5 英尺 4 英寸——自 1960 年以来并未真正改变过。",
      ai: { backbone: "主语 average height、谓语 hasn’t changed；时间状语 since 1960", structure: ["介词短语 according to the Centers for Disease Control and Prevention：作状语，说明信息来源","破折号之间的插入语 5'9\" for men, 5'4\" for women：解释 average height 的具体数值","时间状语 since 1960：修饰 hasn’t changed"], collocations: ["according to（根据）","average height（平均身高）","Centers for Disease Control and Prevention（疾病控制与预防中心）"] }}
    ]
  },
  {
    day: 64,
    type: "英一",
    source: "2008 Text 3",
    zh: "从基因角度来讲，避免身材过高是有好处的。分娩过程中，较大的婴儿更难通过产道。此外，尽管人类已经直立行走了几百万年，但两足和背部仍继续同两足行走的姿势相抗衡，因而难以轻易承受过大过长的肢体反复施加的压力。西北大学人类学家威廉·伦纳德称:“对身高的一些真正限制是由个体有机体的基因结构所设定的”。",
    sentences: [
    { num: "①", en: "Genetically speaking, there are advantages to avoiding substantial height.", ref: "从基因角度来讲，避免身材过高是有好处的。",
      ai: { backbone: "There be 结构：表语 advantages、be 动词 are；不定式 to avoiding substantial height", structure: ["独立主格结构 Genetically speaking：作评注性状语，表示从基因角度来说","介词短语 to avoiding substantial height：作后置定语，修饰 advantages"], collocations: ["genetically speaking（从基因角度来说）","advantages to doing（做……的好处）","substantial height（高个子身材）"] }},
    { num: "②", en: "During childbirth, larger babies have more difficulty passing through the birth canal.", ref: "分娩过程中，较大的婴儿更难通过产道。",
      ai: { backbone: "主语 larger babies、谓语 have、宾语 more difficulty", structure: ["时间状语 During childbirth：说明发生的时间","现在分词短语 passing through the birth canal：作后置定语，修饰 difficulty（have difficulty doing 结构）"], collocations: ["during childbirth（分娩期间）","have difficulty doing（做……有困难）","pass through（穿过，通过）","birth canal（产道）"] }},
    { num: "③", en: "Moreover, even though humans have been upright for millions of years, our feet and back continue to struggle with bipedal posture and cannot easily withstand repeated strain imposed by oversize limbs.", ref: "此外，尽管人类已经直立行走了几百万年，但两足和背部仍继续同两足行走的姿势相抗衡，因而难以轻易承受过大过长的肢体反复施加的压力。",
      ai: { backbone: "主句：主语 our feet and back、谓语 continue to struggle 和 cannot withstand（并列谓语）；让步状语从句 even though humans have been upright", structure: ["让步状语从句 even though humans have been upright for millions of years：表示让步","介词短语 with bipedal posture：与 struggle 搭配，说明与直立行走姿态作斗争","并列谓语 cannot easily withstand：与前一个谓语 continue to struggle 并列","过去分词短语 imposed by oversize limbs：作后置定语，修饰 strain"], collocations: ["struggle with（与……作斗争）","bipedal posture（直立行走的姿态）","withstand strain（承受压力）","oversize limbs（过大的肢体）"] }},
    { num: "④", en: "“There are some real constraints that are set by the genetic architecture of the individual organism,” says anthropologist William Leonard of Northwestern University.", ref: "西北大学人类学家威廉·伦纳德称:“对身高的一些真正限制是由个体有机体的基因结构所设定的”。",
      ai: { backbone: "引语部分为 There be 结构：主语 some real constraints、be 动词 are；主句：谓语 says、主语 anthropologist William Leonard（倒装）", structure: ["定语从句 that are set by the genetic architecture of the individual organism：修饰 constraints","介词短语 of the individual organism：作后置定语，修饰 architecture","介词短语 of Northwestern University：作后置定语，修饰 anthropologist"], collocations: ["real constraints（真正的限制）","be set by（由……设定）","genetic architecture（遗传结构）","individual organism（个体生物体）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "uprightadj.直立的", word: "upright", meaning: "adj.直立的" },
      { raw: "bipedaladj.两足动物的", word: "bipedal", meaning: "adj.两足动物的" },
      { raw: "posturen.姿势", word: "posture", meaning: "n.姿势" },
      { raw: "withstandv.抵住，经受住", word: "withstand", meaning: "v.抵住，经受住" },
      { raw: "strainn.紧张，压力", word: "strain", meaning: "n.紧张，压力" },
      { raw: "imposev.强加于", word: "impose", meaning: "v.强加于" },
      { raw: "limbn.肢体", word: "limb", meaning: "n.肢体" },
      { raw: "strugglewith与...斗争，努力应对", word: "strugglewith与...斗争，努力应对", meaning: "" }
    ],
        split: "Moreover,//eventhoughhumanshavebeenupright//formillionsofyears,//our feetandbackcontinuetostrugglewithbipedalposture//andcannoteasily withstandrepeatedstrain//imposedbyoversizelimbs.",
        grammar: ["主干：主+谓+宾（并列结构）", "eventhough引导让步状语从句", "and并列两个分句"],
        ref: "此外，尽管人类已经直立行走了几百万年，但两足和背部仍继续同两足行走的姿势相抗衡，因而难以轻易承受过大过长的肢体反复施加的压力。"
      }
    ]
  },
  {
    day: 65,
    type: "英一",
    source: "2008 Text 3",
    zh: "基因最大值可能会改变，但别期望它很快就会发生。马萨诸塞州内蒂克陆军研究中心的资深人类学家克莱尔·戈登保证，90%的制服和工作台适合新兵，无需改动。她说，和篮球运动员的队服不同，军服尺寸一段时间以来从未改动。她还说，如果你需要预测在不久的将来人类的身高以设计一件装备，那基本上“你可以非常有把握地使用当前数据。”",
    sentences: [
    { num: "①", en: "Genetic maximums can change, but don’t expect this to happen soon.", ref: "基因最大值可能会改变，但别期望它很快就会发生。",
      ai: { backbone: "并列句：句1 主语 Genetic maximums、谓语 can change；句2 为祈使句 don’t expect this to happen soon", structure: ["并列连词 but 连接两个并列分句，表示转折","祈使句 don’t expect this to happen soon：句2的主语省略","不定式短语 to happen soon：作宾语补足语，说明 expect 的内容"], collocations: ["genetic maximums（遗传极限）","expect...to do（期望……做某事）"] }},
    { num: "②", en: "Claire C. Gordon, senior anthropologist at the Army Research Center in Natick, Mass. , ensures that 90 percent of the uniforms and workstations fit recruits without alteration.", ref: "马萨诸塞州内蒂克陆军研究中心的资深人类学家克莱尔·戈登保证，90%的制服和工作台适合新兵，无需改动。",
      ai: { backbone: "主语 Claire C. Gordon、谓语 ensures、宾语从句 that 90 percent of the uniforms and workstations fit recruits", structure: ["名词短语 senior anthropologist at the Army Research Center in Natick, Mass.：作同位语，说明 Claire C. Gordon 的身份","介词短语 at the Army Research Center in Natick, Mass.：作后置定语，修饰 anthropologist","宾语从句 that 90 percent of the uniforms and workstations fit recruits without alteration：作 ensures 的宾语"], collocations: ["senior anthropologist（资深人类学家）","army research center（陆军研究中心）","without alteration（无需改动）"] }},
    { num: "③", en: "She says that, unlike those for basketball, the length of military uniforms has not changed for some time.", ref: "她说，和篮球运动员的队服不同，军服尺寸一段时间以来从未改动。",
      ai: { backbone: "主语 She、谓语 says、宾语从句 that the length of military uniforms has not changed", structure: ["宾语从句 that the length of military uniforms has not changed for some time：作 says 的宾语","介词短语 unlike those for basketball：作状语，与篮球制服作对比","介词短语 for some time：时间状语"], collocations: ["military uniforms（军服）","unlike（与……不同）","for some time（一段时间以来）"] }},
    { num: "④", en: "And if you need to predict human height in the near future to design a piece of equipment, Gordon says that by and large, “you could use today’s data and feel fairly confident.”", ref: "她还说，如果你需要预测在不久的将来人类的身高以设计一件装备，那基本上“你可以非常有把握地使用当前数据。”",
      ai: { backbone: "主句：主语 Gordon、谓语 says、宾语从句 that you could use today’s data；条件状语从句 if you need to predict human height", structure: ["条件状语从句 if you need to predict human height in the near future to design a piece of equipment：说明主句成立的条件","不定式短语 to design a piece of equipment：作目的状语，说明预测身高的目的","介词短语 by and large：作插入语，意为“大体上”","宾语从句 that “you could use today’s data and feel fairly confident.”：作 says 的宾语，其中 and feel fairly confident 为并列谓语"], collocations: ["in the near future（在不久的将来）","design equipment（设计设备）","by and large（大体上，总的来说）","feel confident（感到有信心）"] }}
    ]
  },
  {
    day: 66,
    type: "英一",
    source: "2008 Text 4",
    zh: "1784 年，也就是在其成为美国总统的五年前，52 岁的乔治·华盛顿牙齿几乎掉光了。于是他雇用一名牙医移植了九颗牙齿到自己颌中——这些牙齿是从他的奴隶们口中拔出来的。这一形象与大多数人所记得的历史书中“砍樱桃树的乔治”大为不同。但最近，许多历史学家开始关注奴隶制在开国元勋们生活中所扮演的角色。他们在某种程度上是受到了 1998 年获得的 DNA 证据的鼓舞，该证据几乎可以确证托马斯·杰斐逊曾与其奴隶萨利·赫明斯育有至少一个孩子。只在最近三十年间学者们才开始全方位、彻底地研究历史。数位历史学家的著作揭示了美国早期领袖所做的道德妥协以及建国初期的脆弱性。更为重要的是，他们提出，许多开国元勋明知奴隶制是错误的——然而大部分人却极少有行动去抗争它。",
    sentences: [
    { num: "①", en: "In 1784, five years before he became president of the United States, George Washington, 52, was nearly toothless.", ref: "1784 年，也就是在其成为美国总统的五年前，52 岁的乔治·华盛顿牙齿几乎掉光了。",
      ai: { backbone: "主语 George Washington、谓语 was、表语 nearly toothless；时间状语 In 1784", structure: ["时间状语 In 1784：说明主句发生的时间","名词短语 five years before he became president of the United States：作时间状语从句的补充，进一步定位时间","同位语 52：说明华盛顿当时的年龄"], collocations: ["become president（成为总统）","nearly toothless（几乎掉光了牙）"] }},
    { num: "②", en: "So he hired a dentist to transplant nine teeth into his jaw—having extracted them from the mouths of his slaves.", ref: "于是他雇用一名牙医移植了九颗牙齿到自己颌中——这些牙齿是从他的奴隶们口中拔出来的。",
      ai: { backbone: "主语 he、谓语 hired、宾语 a dentist；目的状语 to transplant nine teeth", structure: ["不定式短语 to transplant nine teeth into his jaw：作目的状语，说明雇佣牙医的目的","现在分词短语 having extracted them from the mouths of his slaves：作伴随状语，说明这些牙齿的来源","介词短语 from the mouths of his slaves：说明牙齿的出处"], collocations: ["transplant teeth（移植牙齿）","extract from（从……取出/拔除）","his slaves（他的奴隶）"] }},
    { num: "③", en: "That’s a far different image from the cherry-tree-chopping George most people remember from their history books.", ref: "这一形象与大多数人所记得的历史书中“砍樱桃树的乔治”大为不同。",
      ai: { backbone: "主语 That、谓语 is、表语 a far different image", structure: ["介词短语 from the cherry-tree-chopping George：说明对比对象","定语从句 most people remember from their history books：修饰 George（省略了关系代词 whom）","复合形容词 cherry-tree-chopping：作定语，修饰 George，指砍樱桃树的华盛顿"], collocations: ["far different from（与……大不相同）","cherry-tree-chopping（砍樱桃树的）","history books（历史书）"] }},
    { num: "④", en: "But recently, many historians have begun to focus on the role slavery played in the lives of the founding generation.", ref: "但最近，许多历史学家开始关注奴隶制在开国元勋们生活中所扮演的角色。",
      ai: { backbone: "主语 many historians、谓语 have begun to focus on、宾语 the role", structure: ["时间状语 recently：修饰整个句子","定语从句 slavery played in the lives of the founding generation：修饰 the role（省略了关系代词 that）"], collocations: ["focus on（关注，聚焦）","the founding generation（开国一代）","play a role in（在……中起作用）"] }},
    { num: "⑤", en: "They have been spurred in part by DNA evidence made available in 1998, which almost certainly proved Thomas Jefferson had fathered at least one child with his slave Sally Hemings.", ref: "他们在某种程度上是受到了 1998 年获得的 DNA 证据的鼓舞，该证据几乎可以确证托马斯·杰斐逊曾与其奴隶萨利·赫明斯育有至少一个孩子。",
      ai: { backbone: "主语 They、谓语 have been spurred；状语 in part by DNA evidence；非限制性定语从句 which proved Thomas Jefferson had fathered a child", structure: ["过去分词短语 made available in 1998：作后置定语，修饰 DNA evidence","非限制性定语从句 which almost certainly proved Thomas Jefferson had fathered at least one child with his slave Sally Hemings：修饰 DNA evidence","宾语从句 Thomas Jefferson had fathered at least one child：作 proved 的宾语"], collocations: ["be spurred by（受到……的推动）","in part（部分地）","DNA evidence（DNA证据）","father a child（成为孩子的父亲）"] }},
    { num: "⑥", en: "And only over the past 30 years have scholars examined history from the bottom up.", ref: "只在最近三十年间学者们才开始全方位、彻底地研究历史。",
      ai: { backbone: "主语 scholars、谓语 have examined、宾语 history（倒装句：only + 状语置于句首引起部分倒装）", structure: ["状语 only over the past 30 years：置于句首，引起主句部分倒装，表示“仅在过去的30年里”","介词短语 from the bottom up：作方式状语，表示自下而上地"], collocations: ["over the past 30 years（在过去的30年里）","from the bottom up（自下而上地）","examine history（审视历史）"] }},
    { num: "⑦", en: "Works of several historians reveal the moral compromises made by the nation’s early leaders and the fragile nature of the country’s infancy.", ref: "数位历史学家的著作揭示了美国早期领袖所做的道德妥协以及建国初期的脆弱性。",
      ai: { backbone: "主语 Works of several historians、谓语 reveal、宾语 the moral compromises and the fragile nature", structure: ["介词短语 of several historians：作后置定语，修饰 Works","过去分词短语 made by the nation’s early leaders：作后置定语，修饰 compromises","介词短语 of the country’s infancy：作后置定语，修饰 nature"], collocations: ["moral compromises（道德妥协）","early leaders（早期领导人）","fragile nature（脆弱的本质）"] }},
    { num: "⑧", en: "More significant, they argue that many of the Founding Fathers knew slavery was wrong—and yet most did little to fight it.", ref: "更为重要的是，他们提出，许多开国元勋明知奴隶制是错误的——然而大部分人却极少有行动去抗争它。",
      ai: { backbone: "主句：主语 they、谓语 argue、宾语从句 that many of the Founding Fathers knew slavery was wrong；并列句 and yet most did little", structure: ["评注性状语 More significant：作状语，表示“更重要的是”","宾语从句 that many of the Founding Fathers knew slavery was wrong：作 argue 的宾语","宾语从句 slavery was wrong：作 knew 的宾语","并列分句 and yet most did little to fight it：表示转折，其中不定式 to fight it 作目的状语"], collocations: ["more significant（更重要的是）","the Founding Fathers（开国元勋）","do little to do（几乎不做什么）","fight slavery（抵制奴隶制）"] }}
    ],
    analysis: [
      {
        sentNum: "⑦",
        vocab: [
      { raw: "revealv.揭露", word: "reveal", meaning: "v.揭露" },
      { raw: "moraladj.道德的", word: "moral", meaning: "adj.道德的" },
      { raw: "compromisen.妥协", word: "compromise", meaning: "n.妥协" },
      { raw: "fragileadj.脆弱的", word: "fragile", meaning: "adj.脆弱的" },
      { raw: "naturen.本质，特性", word: "nature", meaning: "n.本质，特性" },
      { raw: "infancyn.婴儿期，初期", word: "infancy", meaning: "n.婴儿期，初期" }
    ],
        split: "Works//ofseveralhistoriansrevealthemoralcompromises//madebythe nation’searlyleaders//andthefragilenature//ofthecountry’sinfancy.",
        grammar: ["主干：主+谓+宾", "主干结构提炼：WorksrevealAandB.", "makecompromise做出妥协", "naturen.本质，特性", "and并列moralcompromises和fragilenature"],
        ref: "数位历史学家的著作揭示了美国早期领袖所做的道德妥协以及建国初期的脆弱性。"
      }
    ]
  },
  {
    day: 67,
    type: "英一",
    source: "2008 Text 4",
    zh: "最为重要的是，历史学家表示，开国元勋们受到了他们那个时代文化的束缚。尽管华盛顿和杰斐逊私下表达过对奴隶制的反感，但他们也明白奴隶制是他们帮助创建的这个国家的政治与经济基石的一部分。一方面，南方承担不起放弃奴隶的后果。拥有奴隶就“如同拥有大额银行存款”，《不完美的神：乔治·华盛顿，他的奴隶和美利坚的创立》一书的作者温瑟柯说道。如果没有对这种“特别制度”的保护条款，其中包括一项出于国会代表权的目的而将一名奴隶视为 3/5 个人的条款，南方各州当时便不会签署宪法。",
    sentences: [
    { num: "①", en: "More than anything, the historians say, the founders were hampered by the culture of their time.", ref: "最为重要的是，历史学家表示，开国元勋们受到了他们那个时代文化的束缚。",
      ai: { backbone: "主语 the founders、谓语 were hampered；原因状语 by the culture of their time", structure: ["评注性状语 More than anything：作状语，表示“最重要的是”","插入语 the historians say：作插入成分，说明信息来源","介词短语 by the culture of their time：引出施加阻碍的施动者"], collocations: ["more than anything（最重要的是）","be hampered by（受到……的阻碍）","the culture of their time（他们所处时代的文化）"] }},
    { num: "②", en: "While Washington and Jefferson privately expressed distaste for slavery, they also understood that it was part of the political and economic bedrock of the country they helped to create.", ref: "尽管华盛顿和杰斐逊私下表达过对奴隶制的反感，但他们也明白奴隶制是他们帮助创建的这个国家的政治与经济基石的一部分。",
      ai: { backbone: "主句：主语 they、谓语 understood、宾语从句 that it was part of the bedrock；让步状语从句 While Washington and Jefferson expressed distaste", structure: ["让步状语从句 While Washington and Jefferson privately expressed distaste for slavery：表示让步","宾语从句 that it was part of the political and economic bedrock of the country：作 understood 的宾语","定语从句 they helped to create：修饰 the country（省略了关系代词 that）"], collocations: ["express distaste for（表达对……的厌恶）","political and economic bedrock（政治和经济根基）","help to do（帮助做某事）"] }},
    { num: "③", en: "For one thing, the South could not afford to part with its slaves.", ref: "一方面，南方承担不起放弃奴隶的后果。",
      ai: { backbone: "主语 the South、谓语 could not afford、宾语 to part with its slaves", structure: ["评注性状语 For one thing：作状语，表示“首先”","不定式短语 to part with its slaves：作 afford 的宾语"], collocations: ["for one thing（首先）","afford to do（承担得起做某事）","part with（放弃，割舍）"] }},
    { num: "④", en: "Owning slaves was “like having a large bank account,” says Wiencek, author of An Imperfect God: George Washington, His Slaves, and the Creation of America.", ref: "拥有奴隶就“如同拥有大额银行存款”，《不完美的神：乔治·华盛顿，他的奴隶和美利坚的创立》一书的作者温瑟柯说道。",
      ai: { backbone: "引语部分：主语 Owning slaves、谓语 was、表语 like having a large bank account；主句：谓语 says、主语 Wiencek（倒装）", structure: ["动名词短语 Owning slaves：作主语","介词短语 like having a large bank account：作表语，比喻拥有奴隶如同拥有大额银行账户","名词短语 author of An Imperfect God: George Washington, His Slaves, and the Creation of America：作同位语，说明 Wiencek 的身份"], collocations: ["own slaves（拥有奴隶）","a large bank account（大额银行账户）","author of（……的作者）"] }},
    { num: "⑤", en: "The southern states would not have signed the Constitution without protections for the “peculiar institution,” including a clause that counted a slave as three fifths of a man for purposes of congressional representation.", ref: "如果没有对这种“特别制度”的保护条款，其中包括一项出于国会代表权的目的而将一名奴隶视为 3/5 个人的条款，南方各州当时便不会签署宪法。",
      ai: { backbone: "主语 The southern states、谓语 would not have signed、宾语 the Constitution；条件状语 without protections", structure: ["介词短语 without protections for the “peculiar institution”：表示条件（与过去事实相反的虚拟语气）","现在分词短语 including a clause that counted a slave as three fifths of a man：作后置定语，补充说明 protections 的内容","定语从句 that counted a slave as three fifths of a man：修饰 a clause","介词短语 for purposes of congressional representation：说明计算奴隶的目的"], collocations: ["sign the Constitution（签署宪法）","the “peculiar institution”（“特殊制度”，指奴隶制）","count...as（把……算作）","for purposes of（为了……的目的）"] }}
    ]
  },
  {
    day: 68,
    type: "英一",
    source: "2008 Text 4",
    zh: "并且这些政治家的政治生涯也取决于奴隶制。五分之三方案使选举人团中南方各州的选票数得以激增，使杰斐逊在 1800 年总统大选中得以险胜。杰斐逊一就职，便通过 1803 年的“路易斯安那购地案”扩大了奴隶制的范围，这片新土地被划分成 13 个州，包括三个蓄奴州。即便如此，但杰斐逊还是解放了赫明斯的孩子们——虽然没有解放她本人和其他大约 150名奴隶。在目睹了独立战争中黑人士兵的勇敢后，华盛顿开始相信人人生而平等，从而克服亲属的强烈反对，在遗嘱中给予了他的奴隶自由。就在十年前，这种行为在弗吉尼亚还要得到立法机构的批准。",
    sentences: [
    { num: "①", en: "And the statesmen’s political lives depended on slavery.", ref: "并且这些政治家的政治生涯也取决于奴隶制。",
      ai: { backbone: "主语 the statesmen’s political lives、谓语 depended on、宾语 slavery", structure: ["定语 statesmen’s：作所有格定语，修饰 political lives"], collocations: ["depend on（依赖于）","political lives（政治生涯）"] }},
    { num: "②", en: "The three-fifths formula handed Jefferson his narrow victory in the presidential election of 1800 by inflating the votes of the southern states in the Electoral College.", ref: "五分之三方案使选举人团中南方各州的选票数得以激增，使杰斐逊在 1800 年总统大选中得以险胜。",
      ai: { backbone: "主语 The three-fifths formula、谓语 handed、宾语 Jefferson、宾补 his narrow victory", structure: ["介词短语 by inflating the votes of the southern states in the Electoral College：作方式状语，说明如何帮助杰斐逊获胜","介词短语 in the presidential election of 1800：说明具体选举","介词短语 of the southern states in the Electoral College：作后置定语，修饰 votes"], collocations: ["hand sb. a victory（让某人获胜）","narrow victory（险胜）","the Electoral College（选举人团）","inflate the votes（抬高选票）"] }},
    { num: "③", en: "Once in office, Jefferson extended slavery with the Louisiana Purchase in 1803; the new land was carved into 13 states, including three slave states.", ref: "杰斐逊一就职，便通过 1803 年的“路易斯安那购地案”扩大了奴隶制的范围，这片新土地被划分成 13 个州，包括三个蓄奴州。",
      ai: { backbone: "并列句：句1 主语 Jefferson、谓语 extended、宾语 slavery；句2 主语 the new land、谓语 was carved", structure: ["时间状语 Once in office：表示一上任","介词短语 with the Louisiana Purchase in 1803：说明手段和时间","分号连接第二个分句 the new land was carved into 13 states","现在分词短语 including three slave states：作后置定语，补充说明13个州中包括三个蓄奴州"], collocations: ["once in office（一上任）","the Louisiana Purchase（路易斯安那购地）","be carved into（被分割成）","slave states（蓄奴州）"] }},
    { num: "④", en: "Still, Jefferson freed Hemings’s children—though not Hemings herself or his approximately 150 other slaves.", ref: "即便如此，但杰斐逊还是解放了赫明斯的孩子们——虽然没有解放她本人和其他大约 150名奴隶。",
      ai: { backbone: "主语 Jefferson、谓语 freed、宾语 Hemings’s children", structure: ["插入成分 though not Hemings herself or his approximately 150 other slaves：作让步性补充说明，由 though 引导，省略了 he freed"], collocations: ["free sb.（解放某人）","approximately 150 other slaves（大约150名其他奴隶）"] }},
    { num: "⑤", en: "Washington, who had begun to believe that all men were created equal after observing the bravery of the black soldiers during the Revolutionary War, overcame the strong opposition of his relatives to grant his slaves their freedom in his will.", ref: "在目睹了独立战争中黑人士兵的勇敢后，华盛顿开始相信人人生而平等，从而克服亲属的强烈反对，在遗嘱中给予了他的奴隶自由。",
      ai: { backbone: "主语 Washington、谓语 overcame、宾语 the strong opposition", structure: ["非限制性定语从句 who had begun to believe that all men were created equal after observing the bravery of the black soldiers during the Revolutionary War：修饰 Washington","宾语从句 that all men were created equal：作 believe 的宾语","介词短语 after observing the bravery of the black soldiers during the Revolutionary War：作时间状语","不定式短语 to grant his slaves their freedom in his will：作目的状语，说明克服反对的目的"], collocations: ["be created equal（生而平等）","overcome opposition（克服反对）","grant sb. freedom（给予某人自由）","in one’s will（在遗嘱中）"] }},
    { num: "⑥", en: "Only a decade earlier, such an act would have required legislative approval in Virginia.", ref: "就在十年前，这种行为在弗吉尼亚还要得到立法机构的批准。",
      ai: { backbone: "主语 such an act、谓语 would have required、宾语 legislative approval；时间状语 Only a decade earlier", structure: ["时间状语 Only a decade earlier：说明时间对比","介词短语 in Virginia：说明地点","would have required：与过去事实相反的虚拟语气"], collocations: ["require legislative approval（需要立法批准）","a decade earlier（十年前）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "observev.观察", word: "observe", meaning: "v.观察" },
      { raw: "braveryn.勇敢的行为", word: "bravery", meaning: "n.勇敢的行为" },
      { raw: "overcomev.克服", word: "overcome", meaning: "v.克服" },
      { raw: "oppositionn.反对", word: "opposition", meaning: "n.反对" },
      { raw: "relativen.亲戚", word: "relative", meaning: "n.亲戚" },
      { raw: "grantv.授予", word: "grant", meaning: "v.授予" },
      { raw: "willn.遗嘱", word: "will", meaning: "n.遗嘱" },
      { raw: "theRevolutionaryWar独立战争", word: "theRevolutionaryWar独立战争", meaning: "" }
    ],
        split: "Washington,//whohadbeguntobelieve//thatallmenwerecreatedequal//after observingthebravery//oftheblacksoldiers//duringtheRevolutionaryWar, overcamethestrongopposition//ofhisrelatives//togranthisslavestheirfreedom //inhiswill.",
        grammar: ["主干：主+谓+宾", "who引导定语从句", "that引导宾语从句", "allmenwerecreatedequal“人人生而平等”（equal可理解为主语补足语）", "who引导的定语从句在本句中暗含因果关系（afterprep.鉴于，由于）"],
        ref: "在目睹了独立战争中黑人士兵的勇敢后，华盛顿开始相信人人生而平等，从而克服亲属的强烈反对，在遗嘱中给予了他的奴隶自由。"
      }
    ]
  },
  {
    day: 69,
    type: "英一",
    source: "2009 Text 1",
    zh: "习惯是个奇特的东西。我们机械地按其行事：将大脑设定为自动驾驶模式，放松地进入熟悉的常规所带来的无意识舒适状态。威廉·华兹华斯在 19 世纪曾说过:“不是选择而是习惯支配着那些不善思考的人们。在不断变化的 21 世纪，甚至“习惯”这个词本身都带有负面含义。因此，将习惯同创造力和创新在同一语境下讨论似乎矛盾。但脑研究人员发现，当我们有意识地培养新习惯时，我们会在大脑中生成相应的（神经）通路，甚至生成全新的脑细胞，（这些新的通路和脑细胞）能使我们的思路跳上新的、创新的轨道。",
    sentences: [
    { num: "①", en: "Habits are a funny thing.", ref: "习惯是个奇特的东西。",
      ai: { backbone: "主语 Habits、谓语 are、表语 a funny thing", structure: ["冠词 a + 形容词 funny：作定语，修饰 thing"], collocations: ["a funny thing（一件有趣的事）"] }},
    { num: "②", en: "We reach for them mindlessly, setting our brains on auto-pilot and relaxing into the unconscious comfort of familiar routine.", ref: "我们机械地按其行事：将大脑设定为自动驾驶模式，放松地进入熟悉的常规所带来的无意识舒适状态。",
      ai: { backbone: "主语 We、谓语 reach for、宾语 them；方式状语 mindlessly", structure: ["现在分词短语 setting our brains on auto-pilot：作伴随状语","现在分词短语 relaxing into the unconscious comfort of familiar routine：与 setting 并列，作伴随状语","介词短语 of familiar routine：作后置定语，修饰 comfort"], collocations: ["reach for（伸手去拿，不知不觉地去做）","set...on auto-pilot（让……处于自动模式）","familiar routine（熟悉的日常习惯）"] }},
    { num: "③", en: "“Not choice, but habit rules the unreflecting herd,” William Wordsworth said in the 19th century.", ref: "威廉·华兹华斯在 19 世纪曾说过:“不是选择而是习惯支配着那些不善思考的人们。",
      ai: { backbone: "主语 Not choice, but habit、谓语 rules、宾语 the unreflecting herd；引语后为 William Wordsworth said", structure: ["并列主语 Not choice, but habit：由 not...but 连接，强调后者","介词短语 in the 19th century：时间状语，说明华兹华斯说这句话的时间"], collocations: ["not...but...（不是……而是……）","rule the herd（统治大众）","unreflecting herd（不加思考的芸芸众生）"] }},
    { num: "④", en: "In the ever-changing 21st century, even the word “habit” carries a negative implication.", ref: "在不断变化的 21 世纪，甚至“习惯”这个词本身都带有负面含义。",
      ai: { backbone: "主语 the word “habit”、谓语 carries、宾语 a negative implication", structure: ["介词短语 In the ever-changing 21st century：时间状语","同位语 “habit”：解释说明 the word"], collocations: ["in the ever-changing 21st century（在不断变化的21世纪）","carry a negative implication（带有负面含义）"] }},
    { num: "⑤", en: "So it seems paradoxical to talk about habits in the same context as creativity and innovation.", ref: "因此，将习惯同创造力和创新在同一语境下讨论似乎矛盾。",
      ai: { backbone: "主语 it、谓语 seems、表语 paradoxical；不定式 to talk about habits", structure: ["形式主语 it 指代真正主语 to talk about habits in the same context as creativity and innovation","介词短语 in the same context as creativity and innovation：说明谈论习惯的语境"], collocations: ["seem paradoxical（似乎自相矛盾）","in the same context as（与……在同一语境下）"] }},
    { num: "⑥", en: "But brain researchers have discovered that when we consciously develop new habits, we create parallel paths, and even entirely new brain cells, that can jump our trains of thought onto new, innovative tracks.", ref: "但脑研究人员发现，当我们有意识地培养新习惯时，我们会在大脑中生成相应的（神经）通路，甚至生成全新的脑细胞，（这些新的通路和脑细胞）能使我们的思路跳上新的、创新的轨道。",
      ai: { backbone: "主句：主语 brain researchers、谓语 have discovered、宾语从句 that when we consciously develop new habits, we create parallel paths", structure: ["宾语从句 that...：作 have discovered 的宾语","时间状语从句 when we consciously develop new habits：修饰宾语从句中的主句","并列宾语 parallel paths and even entirely new brain cells","定语从句 that can jump our trains of thought onto new, innovative tracks：修饰 paths and brain cells"], collocations: ["consciously develop（有意识地培养）","parallel paths（平行的路径）","trains of thought（思路）","jump onto new tracks（跳到新的轨道上）"] }}
    ]
  },
  {
    day: 70,
    type: "英一",
    source: "2009 Text 1",
    zh: "不要轻易将自己视为无法改变的凭习惯行事的生物，相反，我们可以通过有意识地培养新习惯来引导自己的改变。事实上，我们尝试的新事物越多——走出自身舒适区越多——我们就会变得越具有内在的创造力，无论是在职场上还是在私人生活中均是如此。",
    sentences: [
    { num: "①", en: "Rather than dismissing ourselves as unchangeable creatures of habit, we can instead direct our own change by consciously developing new habits.", ref: "不要轻易将自己视为无法改变的凭习惯行事的生物，相反，我们可以通过有意识地培养新习惯来引导自己的改变。",
      ai: { backbone: "主语 we、谓语 can direct、宾语 our own change；方式状语 by consciously developing new habits", structure: ["介词短语 Rather than dismissing ourselves as unchangeable creatures of habit：作状语，表示而不是……","介词短语 as unchangeable creatures of habit：作宾语补足语，说明把自身视为……","介词短语 by consciously developing new habits：作方式状语"], collocations: ["rather than（而不是）","dismiss...as（把……视为……而置之不理）","creatures of habit（习惯的奴隶）","direct one’s own change（主导自身的改变）"] }},
    { num: "②", en: "In fact, the more new things we try — the more we step outside our comfort zone — the more inherently creative we become, both in the workplace and in our personal lives.", ref: "事实上，我们尝试的新事物越多——走出自身舒适区越多——我们就会变得越具有内在的创造力，无论是在职场上还是在私人生活中均是如此。",
      ai: { backbone: "主句：主语 the more new things we try、谓语 become、表语 the more inherently creative；比较级 the more...the more 结构", structure: ["比较结构 the more new things we try — the more we step outside our comfort zone — the more inherently creative we become：表示越……越……","插入成分 the more we step outside our comfort zone：对前文进行解释说明","介词短语 both in the workplace and in our personal lives：作状语，说明范围"], collocations: ["the more...the more...（越……越……）","step outside one’s comfort zone（走出舒适区）","inherently creative（天生有创造力）","in the workplace（在工作场所）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "dismissv.不考虑；解雇；驳回", word: "dismiss", meaning: "v.不考虑；解雇；驳回" },
      { raw: "insteadadv.代替，反而", word: "instead", meaning: "adv.代替，反而" },
      { raw: "ratherthan而不是", word: "ratherthan而不是", meaning: "" },
      { raw: "dismissAasB不考虑A作为B=认为是B这样的而不考虑A=因为是B这种", word: "dismissAasB不考虑A", meaning: "作为B=认为是B这样的而不考虑A=因为是B这种" },
      { raw: "理由而不考虑A（否A不否B）", word: "理由而不考虑A（否A不否B）", meaning: "" }
    ],
        split: "Ratherthandismissingourselves//asunchangeablecreatures//ofhabit,//wecan insteaddirectourownchange//byconsciouslydevelopingnewhabits.",
        grammar: ["主干：主+谓+宾", "ratherthan“而不是”表否定", "dismissAasB不考虑A作为B=认为是B这样的而不考虑A=因为是B这种", "理由而不考虑A（否A不否B）", "insteadadv.反而，转而"],
        ref: "不要轻易将自己视为无法改变的凭习惯行事的生物，相反，我们可以通过有意识地培养新习惯来引导自己的改变。"
      },
      {
        sentNum: "②",
        vocab: [
      { raw: "stepoutside走出", word: "stepoutside走出", meaning: "" },
      { raw: "comfortzone舒适区", word: "comfortzone舒适区", meaning: "" }
    ],
        split: "Infact,themorenewthingswetry//—themorewestepoutsideourcomfort zone—//themoreinherentlycreativewebecome,//bothintheworkplace//andinour personallives.",
        grammar: ["主干：主+系+表", "结构提炼：the+比较级+主语+谓语，the+比较级+主语+谓语，意为“越...，越...”", "第一个the+比较级引导状语从句，第二个the+比较级为主句", "bothin...andin...介词短语作状语"],
        ref: "事实上，我们尝试的新事物越多--走出自身舒适区越多--我们就会变得越具有内在的创造力，无论是在职场上还是在私人生活中均是如此。"
      }
    ]
  },
  {
    day: 71,
    type: "英一",
    source: "2009 Text 1",
    zh: "但是，不必费力试图根除旧习惯。一旦那些常规做法的“辙痕”被印入大脑，则它们将长久存在。相反，我们刻意培养的新习惯会在大脑中生成相似的通路，它们可以绕开那些旧的线路。《开放的思维》一书作者道娜·马尔科娃说:“创新所需的首要条件是强烈的好奇心。但我们却被教导去‘做决定’，正如我们的总统称自己是‘决策者’一样”。她又补充道，然而，“做决定是只保留一种可能而将其他可能全部扼杀。（但是，）一个出色的创新型思考者却总在探寻着其他多种可能性。”",
    sentences: [
    { num: "①", en: "But don’t bother trying to kill off old habits;", ref: "但是，不必费力试图根除旧习惯。",
      ai: { backbone: "祈使句：谓语 don’t bother、宾语 to try to kill off old habits", structure: ["不定式短语 to try to kill off old habits：作 bother 的宾语","祈使句省略主语 you"], collocations: ["don’t bother doing/to do（不必费心做某事）","kill off（消灭，根除）","old habits（旧习惯）"] }},
    { num: "②", en: "once those ruts of procedure are worn into the brain, they’re there to stay.", ref: "一旦那些常规做法的“辙痕”被印入大脑，则它们将长久存在。",
      ai: { backbone: "主句：主语 they、谓语 are there to stay；时间状语从句 once those ruts of procedure are worn into the brain", structure: ["时间状语从句 once those ruts of procedure are worn into the brain：表示“一旦……”","介词短语 into the brain：说明刻入的位置"], collocations: ["ruts of procedure（程序化的固定套路）","be worn into（被刻入，被印入）","be there to stay（永久存在，不会消失）"] }},
    { num: "③", en: "Instead, the new habits we deliberately press into ourselves create parallel pathways that can bypass those old roads.", ref: "相反，我们刻意培养的新习惯会在大脑中生成相似的通路，它们可以绕开那些旧的线路。",
      ai: { backbone: "主语 the new habits、谓语 create、宾语 parallel pathways", structure: ["定语从句 we deliberately press into ourselves：修饰 the new habits（省略了关系代词 that）","介词短语 into ourselves：说明习惯被刻入的对象","定语从句 that can bypass those old roads：修饰 parallel pathways"], collocations: ["deliberately press into（有意地印入）","parallel pathways（平行路径）","bypass（绕过）"] }},
    { num: "④", en: "“The first thing needed for innovation is a fascination with wonder,” says Dawna Markova, author of The Open Mind.", ref: "《开放的思维》一书作者道娜·马尔科娃说:“创新所需的首要条件是强烈的好奇心。",
      ai: { backbone: "引语：主语 The first thing、谓语 needed、表语 a fascination with wonder；主句：谓语 says、主语 Dawna Markova（倒装）", structure: ["过去分词短语 needed for innovation：作后置定语，修饰 The first thing","名词短语 author of The Open Mind：作同位语，说明 Dawna Markova 的身份"], collocations: ["the first thing needed for（……首先需要的东西）","a fascination with wonder（对奇迹的痴迷）","author of（……的作者）"] }},
    { num: "⑤", en: "“But we are taught instead to ‘decide,’ just as our president calls himself ‘the Decider.’", ref: "但我们却被教导去‘做决定’，正如我们的总统称自己是‘决策者’一样”。",
      ai: { backbone: "主语 we、谓语 are taught、不定式 to ‘decide’；方式状语 instead", structure: ["介词短语 instead：作状语，表示“相反地”","方式状语从句 just as our president calls himself ‘the Decider.’：表示正如……","宾语补足语 ‘the Decider.’：说明总统自称的内容"], collocations: ["be taught to do（被教导去做某事）","just as（正如）","call oneself（自称）"] }},
    { num: "⑥", en: "” She adds, however, that “to decide is to kill off all possibilities but one.", ref: "她又补充道，然而，“做决定是只保留一种可能而将其他可能全部扼杀。",
      ai: { backbone: "主语 She、谓语 adds、宾语从句 that “to decide is to kill off all possibilities but one”", structure: ["插入语 however：表转折","宾语从句 that “to decide is to kill off all possibilities but one.”：作 adds 的宾语","不定式短语 to decide：作宾语从句的主语，to kill off all possibilities but one 作表语"], collocations: ["add that（补充说）","kill off possibilities（扼杀可能性）","but one（除了一个以外）"] }},
    { num: "⑦", en: "A good innovational thinker is always exploring the many other possibilities.”", ref: "（但是，）一个出色的创新型思考者却总在探寻着其他多种可能性。”",
      ai: { backbone: "主语 A good innovational thinker、谓语 is always exploring、宾语 the many other possibilities", structure: ["形容词短语 good innovational：作定语，修饰 thinker"], collocations: ["innovational thinker（创新型思考者）","explore possibilities（探索可能性）"] }}
    ]
  },
  {
    day: 72,
    type: "英一",
    source: "2009 Text 1",
    zh: "她说，我们都以我们意识不到的方式来解决问题。20 世纪 60 年代晚期的研究者们发现，人生来具有以四种基本方式应对挑战的能力：分析地、按流程地、联系地（或协作地）、创新地（应对挑战）。然而，在青春期结束时，大脑关闭了其中一半能力，只保留了那些在生命最初大约十年中似乎最有价值的思维方式。",
    sentences: [
    { num: "①", en: "All of us work through problems in ways of which we’re unaware, she says.", ref: "她说，我们都以我们意识不到的方式来解决问题。",
      ai: { backbone: "主语 All of us、谓语 work through、宾语 problems", structure: ["介词短语 in ways of which we’re unaware：作方式状语，其中 of which 引导定语从句修饰 ways","插入语 she says：说明信息来源"], collocations: ["work through problems（解决难题）","be unaware of（没有意识到）","in ways of which...（以……的方式）"] }},
    { num: "②", en: "Researchers in the late 1960s discovered that humans are born with the capacity to approach challenges in four primary ways: analytically, procedurally, relationally (or collaboratively) and innovatively.", ref: "20 世纪 60 年代晚期的研究者们发现，人生来具有以四种基本方式应对挑战的能力：分析地、按流程地、联系地（或协作地）、创新地（应对挑战）。",
      ai: { backbone: "主语 Researchers、谓语 discovered、宾语从句 that humans are born with the capacity to approach challenges", structure: ["时间状语 in the late 1960s：说明发现的时间","宾语从句 that humans are born with the capacity to approach challenges in four primary ways：作 discovered 的宾语","介词短语 in four primary ways：说明方式","冒号后的并列副词 analytically, procedurally, relationally (or collaboratively) and innovatively：具体说明四种方式"], collocations: ["be born with（天生具有）","the capacity to do（做某事的能力）","approach challenges（应对挑战）","in four primary ways（以四种主要方式）"] }},
    { num: "③", en: "At the end of adolescence, however, the brain shuts down half of that capacity, preserving only those modes of thought that have seemed most valuable during the first decade or so of life.", ref: "然而，在青春期结束时，大脑关闭了其中一半能力，只保留了那些在生命最初大约十年中似乎最有价值的思维方式。",
      ai: { backbone: "主句：主语 the brain、谓语 shuts down、宾语 half of that capacity；时间状语 At the end of adolescence", structure: ["时间状语 At the end of adolescence：说明时间","介词短语 however：表转折","现在分词短语 preserving only those modes of thought：作伴随状语，说明随之保留的内容","定语从句 that have seemed most valuable during the first decade or so of life：修饰 modes of thought"], collocations: ["at the end of（在……结束时）","shut down（关闭，抑制）","modes of thought（思维模式）","the first decade or so of life（人生最初十年左右）"] }}
    ]
  },
  {
    day: 73,
    type: "英一",
    source: "2009 Text 1",
    zh: "当前对标准化测试的重视就是强调分析和流程，这意味着我们很少有人会本能地使用创新和协作的思维方式。“这打破了美国信仰体系中的主要准则——任何人可以做任何事，”2006年出版的《今年我打算……》一书的作者、马尔科娃女士的商业伙伴赖安说道。“这个准则是我们一直以来维系的一个谎言，它助长了平庸。了解你所擅长的并多加练习才能造就辉煌。这正是培养新习惯的意义所在。",
    sentences: [
    { num: "①", en: "The current emphasis on standardized testing highlights analysis and procedure, meaning that few of us inherently use our innovative and collaborative modes of thought.", ref: "当前对标准化测试的重视就是强调分析和流程，这意味着我们很少有人会本能地使用创新和协作的思维方式。",
      ai: { backbone: "主语 The current emphasis on standardized testing、谓语 highlights、宾语 analysis and procedure", structure: ["介词短语 on standardized testing：作后置定语，修饰 emphasis","现在分词短语 meaning that few of us inherently use our innovative and collaborative modes of thought：作伴随状语，进一步说明","宾语从句 that few of us inherently use our innovative and collaborative modes of thought：作 meaning 的宾语"], collocations: ["current emphasis on（当前对……的强调）","standardized testing（标准化测试）","inherently（天生地，内在地）","modes of thought（思维模式）"] }},
    { num: "②", en: "“This breaks the major rule in the American belief system — that anyone can do anything,” explains M. J. Ryan, author of the 2006 book This Year I Will... and Ms. Markova’s business partner.", ref: "“这打破了美国信仰体系中的主要准则——任何人可以做任何事，”2006年出版的《今年我打算……》一书的作者、马尔科娃女士的商业伙伴赖安说道。",
      ai: { backbone: "引语：主语 This、谓语 breaks、宾语 the major rule；主句：谓语 explains、主语 M. J. Ryan（倒装）", structure: ["破折号后的同位语从句 that anyone can do anything：解释说明 the major rule 的具体内容","名词短语 author of the 2006 book This Year I Will... and Ms. Markova’s business partner：作同位语，说明 M. J. Ryan 的身份","介词短语 in the American belief system：作后置定语，修饰 rule"], collocations: ["break the rule（打破规则）","belief system（信仰体系）","business partner（商业伙伴）"] }},
    { num: "③", en: "“That’s a lie that we have perpetuated, and it fosters commonness.", ref: "“这个准则是我们一直以来维系的一个谎言，它助长了平庸。",
      ai: { backbone: "主句：主语 That、谓语 is、表语 a lie；定语从句 that we have perpetuated；并列句 and it fosters commonness", structure: ["定语从句 that we have perpetuated：修饰 a lie","并列谓语 fosters commonness：与前面的分句并列，说明谎言造成的后果"], collocations: ["perpetuate a lie（使谎言长期存在）","foster commonness（助长平庸）"] }},
    { num: "④", en: "Knowing what you’re good at and doing even more of it creates excellence.”", ref: "了解你所擅长的并多加练习才能造就辉煌。",
      ai: { backbone: "并列动名词：主语 Knowing what you’re good at and doing even more of it、谓语 creates、宾语 excellence", structure: ["动名词短语 Knowing what you’re good at：作并列主语之一","宾语从句 what you’re good at：作 Knowing 的宾语","动名词短语 doing even more of it：作并列主语之二"], collocations: ["be good at（擅长）","create excellence（创造卓越）"] }},
    { num: "⑤", en: "This is where developing new habits comes in.", ref: "这正是培养新习惯的意义所在。",
      ai: { backbone: "This 为指示代词作主语、谓语 is、表语 where 从句", structure: ["表语从句 where developing new habits comes in：作表语，说明“这正是培养新习惯发挥作用的地方”","动名词短语 developing new habits：作表语从句的主语"], collocations: ["come in（起作用，发挥作用）","develop new habits（培养新习惯）"] }}
    ]
  },
  {
    day: 74,
    type: "英一",
    source: "2009 Text 2",
    zh: "再睿智的父亲也未必能认出自己的孩子，但现在男性能够提升其为人父的智慧——或者说至少能确认自己就是孩子的父亲。他所需要做的仅仅是花 30 美元到邻近药店购买一份父子关系鉴定工具包（PTK），再花上 120 美元即可得到检测结果。自去年 PTK 无需医师处方即可购买以来，其购买者已逾 60,000 人，Identigene（一家生产这种非处方工具包的公司）首席运营官道格·福格说。直接向公众出售基因检测服务的公司超过 24 家，价格从几百美元到 2500 多美元不等。",
    sentences: [
    { num: "①", en: "It is a wise father that knows his own child, but today a man can boost his paternal (fatherly) wisdom—or at least confirm that he’s the kid’s dad.", ref: "再睿智的父亲也未必能认出自己的孩子，但现在男性能够提升其为人父的智慧——或者说至少能确认自己就是孩子的父亲。",
      ai: { backbone: "并列句：句1 It is a wise father that knows his own child（强调句型）；句2 主语 a man、谓语 can boost、宾语 his paternal wisdom", structure: ["强调句型 It is a wise father that knows his own child：强调主语","插入语 (fatherly)：对 paternal 的释义","并列谓语 or at least confirm that he’s the kid’s dad：与 boost 并列","宾语从句 that he’s the kid’s dad：作 confirm 的宾语"], collocations: ["it is...that...（正是……）","paternal wisdom（为父的智慧）","at least（至少）"] }},
    { num: "②", en: "All he needs to do is shell out $30 for paternity testing kit (PTK) at his local drugstore — and another $120 to get the results.", ref: "他所需要做的仅仅是花 30 美元到邻近药店购买一份父子关系鉴定工具包（PTK），再花上 120 美元即可得到检测结果。",
      ai: { backbone: "主语 All、谓语 is to do、宾语 $30 for paternity testing kit 和 another $120 to get the results（并列）", structure: ["定语从句 he needs to do：修饰 All（省略了关系代词 that）","不定式短语 to shell out $30：作表语","介词短语 at his local drugstore：说明购买地点","并列宾语 another $120 to get the results：与 $30 并列，其中不定式 to get the results 作目的状语"], collocations: ["all one needs to do（某人只需做的）","shell out（掏出，支付）","paternity testing kit（亲子鉴定工具包）","at the local drugstore（在本地药店）"] }},
    { num: "③", en: "More than 60,000 people have purchased the PTKs since they first become available without prescriptions last years, according to Doug Fogg, chief operating officer of Identigene, which makes the over-the-counter kits.", ref: "自去年 PTK 无需医师处方即可购买以来，其购买者已逾 60,000 人，Identigene（一家生产这种非处方工具包的公司）首席运营官道格·福格说。",
      ai: { backbone: "主语 More than 60,000 people、谓语 have purchased、宾语 the PTKs", structure: ["时间状语从句 since they first become available without prescriptions last years：说明时间","介词短语 without prescriptions：说明无需处方","名词短语 chief operating officer of Identigene：作同位语，说明 Doug Fogg 的身份","非限制性定语从句 which makes the over-the-counter kits：修饰 Identigene"], collocations: ["more than（超过）","without prescriptions（无需处方）","chief operating officer（首席运营官）","over-the-counter kits（非处方试剂盒）"] }},
    { num: "④", en: "More than two dozen companies sell DNA tests directly to the public, ranging in price from a few hundred dollars to more than $2500.", ref: "直接向公众出售基因检测服务的公司超过 24 家，价格从几百美元到 2500 多美元不等。",
      ai: { backbone: "主语 More than two dozen companies、谓语 sell、宾语 DNA tests", structure: ["介词短语 directly to the public：说明销售对象","现在分词短语 ranging in price from a few hundred dollars to more than $2500：作后置定语，说明价格区间"], collocations: ["more than two dozen（二十多个）","sell...to the public（向公众出售）","range in price from...to...（价格从……到……不等）"] }}
    ]
  },
  {
    day: 75,
    type: "英一",
    source: "2009 Text 2",
    zh: "基因检测中最受欢迎的有父子关系和亲属关系鉴定，被领养的孩子可利用它来找寻到血亲，家庭可利用它来追踪到给人领养的孩子。基因检测最近还在极富热情的系谱学家当中掀起一阵风——也为提供寻根问祖业务的企业提供支持。大多数检测都需要用棉签蘸取口中唾液采集细胞，并将唾液送到指定公司进行检测。所有的检测都需要一位潜在对照者，以便进行 DNA 比对。",
    sentences: [
    { num: "①", en: "Among the most popular: paternity and kinship testing, which adopted children can use to find their biological relatives and families can use to track down kids put up for adoption.", ref: "基因检测中最受欢迎的有父子关系和亲属关系鉴定，被领养的孩子可利用它来找寻到血亲，家庭可利用它来追踪到给人领养的孩子。",
      ai: { backbone: "主语 paternity and kinship testing、谓语 is（省略）；冒号后为同位语从句解释最受欢迎的测试类型", structure: ["介词短语 Among the most popular：作状语，表示在众多测试中最受欢迎","非限制性定语从句 which adopted children can use to find their biological relatives：修饰 paternity and kinship testing","并列定语从句 and families can use to track down kids put up for adoption：与前面的 which 从句并列，共用先行词","过去分词短语 put up for adoption：作后置定语，修饰 kids"], collocations: ["paternity and kinship testing（亲子与亲属关系鉴定）","biological relatives（血缘亲属）","track down（追查到）","put up for adoption（被送去收养）"] }},
    { num: "②", en: "DNA testing is also the latest rage among passionate genealogists — and supports businesses that offer to search for a family’s geographic roots .", ref: "基因检测最近还在极富热情的系谱学家当中掀起一阵风——也为提供寻根问祖业务的企业提供支持。",
      ai: { backbone: "主句：主语 DNA testing、谓语 is、表语 the latest rage；并列句 and supports businesses", structure: ["介词短语 among passionate genealogists：说明在什么群体中流行","并列谓语 supports businesses：与 is 并列，共享主语 DNA testing","定语从句 that offer to search for a family’s geographic roots：修饰 businesses"], collocations: ["the latest rage（最新的热潮）","passionate genealogists（热衷家谱研究的人）","search for（寻找）","geographic roots（地理根源）"] }},
    { num: "③", en: "Most tests require collecting cells by swabbing saliva in the mouth and sending it to the company for testing.", ref: "大多数检测都需要用棉签蘸取口中唾液采集细胞，并将唾液送到指定公司进行检测。",
      ai: { backbone: "主语 Most tests、谓语 require、宾语 collecting cells", structure: ["动名词短语 collecting cells：作 require 的宾语","介词短语 by swabbing saliva in the mouth：作方式状语，说明采集方式","并列谓语 and sending it to the company：与 collecting 并列，说明另一要求","介词短语 for testing：说明目的"], collocations: ["require doing（需要做某事）","swab saliva（用拭子采集唾液）","send...to...（把……送到……）"] }},
    { num: "④", en: "All tests require a potential candidate with whom to compare DNA.", ref: "所有的检测都需要一位潜在对照者，以便进行 DNA 比对。",
      ai: { backbone: "主语 All tests、谓语 require、宾语 a potential candidate", structure: ["不定式短语 with whom to compare DNA：作后置定语，修饰 candidate，其中 whom 作介词 with 的宾语"], collocations: ["a potential candidate（潜在的对象）","compare DNA（比对DNA）"] }}
    ]
  },
  {
    day: 76,
    type: "英一",
    source: "2009 Text 2",
    zh: "但一些观察家持怀疑态度。纽约大学社会学家特洛伊·达斯特说，“那些声称自己在做家谱检测的人所宣扬的是一种伪精确。他指出，每个人都有许多位祖先——仅上溯几百年就数以百计。然而大部分家谱检测只考虑单一的谱系，或者是同一父系男性遗传的 Y 染色体，或者是仅通过母亲传递（给子女）的线粒体 DNA。这种 DNA 只能揭示一两位祖先的基因信息，尽管，譬如，仅上溯三代，每个人还有另外六位曾祖，上溯四代，还有另外十四位高祖。",
    sentences: [
    { num: "①", en: "But some observers are skeptical.", ref: "但一些观察家持怀疑态度。",
      ai: { backbone: "主语 some observers、谓语 are、表语 skeptical", structure: ["转折连词 But：表示转折"], collocations: ["be skeptical（持怀疑态度）"] }},
    { num: "②", en: "“There is a kind of false precision being hawked by people claiming they are doing ancestry testing,” says Troy Duster, a New York University sociologist.", ref: "纽约大学社会学家特洛伊·达斯特说，“那些声称自己在做家谱检测的人所宣扬的是一种伪精确。",
      ai: { backbone: "引语：There be 结构（a kind of false precision）+ 后置定语；主句：谓语 says、主语 Troy Duster（倒装）", structure: ["过去分词短语 being hawked by people：作后置定语，修饰 false precision","现在分词短语 claiming they are doing ancestry testing：作后置定语，修饰 people","宾语从句 they are doing ancestry testing：作 claiming 的宾语","名词短语 a New York University sociologist：作同位语，说明 Troy Duster 的身份"], collocations: ["a kind of（一种）","false precision（虚假的精确性）","hawk（兜售，宣扬）","ancestry testing（祖先血统检测）"] }},
    { num: "③", en: "He notes that each individual has many ancestors — numbering in the hundreds just a few centuries back.", ref: "他指出，每个人都有许多位祖先——仅上溯几百年就数以百计。",
      ai: { backbone: "主语 he、谓语 notes、宾语从句 that each individual has many ancestors", structure: ["宾语从句 that each individual has many ancestors：作 notes 的宾语","破折号之间的插入语 numbering in the hundreds just a few centuries back：补充说明祖先的数量","现在分词短语 numbering in the hundreds：作后置定语，修饰 ancestors"], collocations: ["note that（指出，注意到）","number in the hundreds（数以百计）","a few centuries back（几个世纪前）"] }},
    { num: "④", en: "Yet most ancestry testing only considers a single lineage, either the Y chromosome inherited through men in a father’s line or mitochondrial DNA, which is passed down only from mothers.", ref: "然而大部分家谱检测只考虑单一的谱系，或者是同一父系男性遗传的 Y 染色体，或者是仅通过母亲传递（给子女）的线粒体 DNA。",
      ai: { backbone: "主语 most ancestry testing、谓语 considers、宾语 a single lineage", structure: ["介词短语 only：作状语，表示“仅仅”","介词短语 either the Y chromosome... or mitochondrial DNA...：作 a single lineage 的同位语，具体说明单一血统","过去分词短语 inherited through men in a father’s line：作后置定语，修饰 Y chromosome","非限制性定语从句 which is passed down only from mothers：修饰 mitochondrial DNA"], collocations: ["a single lineage（单一血统）","Y chromosome（Y染色体）","mitochondrial DNA（线粒体DNA）","be passed down（遗传下来）"] }},
    { num: "⑤", en: "This DNA can reveal genetic information about only one or two ancestors, even though, for example, just three generations back people also have six other great-grandparents or, four generations back, 14 other great-great-grandparents.", ref: "这种 DNA 只能揭示一两位祖先的基因信息，尽管，譬如，仅上溯三代，每个人还有另外六位曾祖，上溯四代，还有另外十四位高祖。",
      ai: { backbone: "主语 This DNA、谓语 can reveal、宾语 genetic information；让步状语从句 even though people have six other great-grandparents", structure: ["介词短语 about only one or two ancestors：说明信息涉及的对象","让步状语从句 even though, for example, just three generations back people also have six other great-grandparents or, four generations back, 14 other great-great-grandparents：表示让步","插入语 for example：举例说明","名词短语 four generations back：作时间状语"], collocations: ["reveal genetic information（揭示基因信息）","even though（尽管）","generations back（往回数几代人）","great-grandparents（曾祖父母）"] }}
    ],
    analysis: [
      {
        sentNum: "④",
        vocab: [
      { raw: "lineagen.血统，世系", word: "lineage", meaning: "n.血统，世系" },
      { raw: "chromosomen.染色体", word: "chromosome", meaning: "n.染色体" },
      { raw: "inheritv.继承", word: "inherit", meaning: "v.继承" },
      { raw: "mitochondrialadj.线粒体的", word: "mitochondrial", meaning: "adj.线粒体的" },
      { raw: "ancestrytesting家谱检测", word: "ancestrytesting家谱检测", meaning: "" }
    ],
        split: "Yetmostancestrytestingonlyconsidersasinglelineage,//eithertheY chromosome//inheritedthroughmen//inafather’sline//ormitochondrialDNA,// whichispasseddown//onlyfrommothers.",
        grammar: ["主干：主+谓+宾", "either...or...并列结构，表示“要么...要么...”（这部分作同位语解释singlelineage）", "inherited...作后置定语（限定Ychromosome）", "which引导非限定性定语从句（限定mitochondrialDNA）"],
        ref: "然而大部分家谱检测只考虑单一的谱系，或者是同一父系男性遗传的Y染色体，或者是仅通过母亲传递(给子女)的线粒体DNA。"
      }
    ]
  },
  {
    day: 77,
    type: "英一",
    source: "2009 Text 2",
    zh: "批评者还指出商业基因检测的好坏只取决于用于样本比对的参考数据库。很多公司使用的数据库并未系统地收集数据，而是将不同研究项目的信息混杂合并一起。这意味着某个 DNA数据库可能有来自某些地区的大量数据，但缺乏其他地区的数据，因此同一个人的检测结果会随着处理研究结果的公司不同而存在差异。另外，公司用于判定亲属关系的计算机程序可能申请了专利，从而不接受同行评审或外界评估。",
    sentences: [
    { num: "①", en: "Critics also argue that commercial genetic testing is only as good as the reference collections to which a sample is compared.", ref: "批评者还指出商业基因检测的好坏只取决于用于样本比对的参考数据库。",
      ai: { backbone: "主语 commercial genetic testing、谓语 is、表语 only as good as the reference collections；介词短语 to which a sample is compared", structure: ["介词短语 only as good as...：作表语，表示“好坏程度只及得上……”","定语从句 to which a sample is compared：修饰 the reference collections"], collocations: ["critics argue（批评者认为）","commercial genetic testing（商业基因检测）","as good as（与……一样好）","reference collections（参照样本库）","be compared to（被与……比较）"] }},
    { num: "②", en: "Databases used by some companies don’t rely on data collected systematically but rather lump together information from different research projects.", ref: "很多公司使用的数据库并未系统地收集数据，而是将不同研究项目的信息混杂合并一起。",
      ai: { backbone: "主语 Databases、谓语 don’t rely on、宾语 data collected systematically；并列句 but rather lump together information", structure: ["过去分词短语 used by some companies：作后置定语，修饰 Databases","过去分词短语 collected systematically：作后置定语，修饰 data","并列谓语 but rather lump together information：与 don’t rely on 并列，表示“而是……”","介词短语 from different research projects：作后置定语，修饰 information"], collocations: ["rely on（依赖）","collect systematically（系统地收集）","lump together（混在一起）","research projects（研究项目）"] }},
    { num: "③", en: "This means that a DNA database may have a lot of data from some regions and not others, so a person’s test results may differ depending on the company that processes the results.", ref: "这意味着某个 DNA数据库可能有来自某些地区的大量数据，但缺乏其他地区的数据，因此同一个人的检测结果会随着处理研究结果的公司不同而存在差异。",
      ai: { backbone: "主句：主语 This、谓语 means、宾语从句 that a DNA database may have a lot of data", structure: ["宾语从句 that a DNA database may have a lot of data from some regions and not others：作 means 的宾语","原因状语从句 so a person’s test results may differ：说明结果","现在分词短语 depending on the company：作伴随状语","定语从句 that processes the results：修饰 the company"], collocations: ["mean that（意味着）","a lot of data（大量数据）","test results（检测结果）","depend on（取决于）","process the results（处理结果）"] }},
    { num: "④", en: "In addition, the computer programs a company uses to estimate relationships may be patented and not subject to peer review or outside evaluation.", ref: "另外，公司用于判定亲属关系的计算机程序可能申请了专利，从而不接受同行评审或外界评估。",
      ai: { backbone: "主语 the computer programs、谓语 may be patented、and may not be subject to peer review；定语从句 a company uses", structure: ["介词短语 In addition：作状语，表“此外”","定语从句 a company uses：修饰 the computer programs（省略了关系代词 that）","并列谓语 may not be subject to peer review or outside evaluation：与 may be patented 并列","不定式短语 to estimate relationships：作目的状语，说明程序用途"], collocations: ["in addition（此外）","estimate relationships（评估亲缘关系）","be patented（获得专利）","be subject to（受……约束）","peer review（同行评审）","outside evaluation（外部评估）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "genetictesting基因检测", word: "genetictesting基因检测", meaning: "" },
      { raw: "referencecollections参考数据库", word: "referencecollections参考数据库", meaning: "" }
    ],
        split: "Criticsalsoargue//thatcommercialgenetictestingisonlyasgoodasthereference collections//towhichasampleiscompared.",
        grammar: ["主干：主+谓+宾从", "that引导宾语从句", "which引导定语从句", "结构提炼：AisonlyasgoodasB=A等同于B=A取决于B", "介词+which的定语从句，本句还原：asampleiscomparedtothereference", "collections"],
        ref: "批评者还指出，商业基因检测的准确率取决于用于样本比对的参考数据库。"
      }
    ]
  },
  {
    day: 78,
    type: "英一",
    source: "2009 Text 3",
    zh: "经济学家和政治家都普遍误解了贫困国家中正规教育与经济增长之间的关系。毫无疑问，这两个领域的进步对于这些国家以及其他所有国家的社会、政治及智力发展而言都必不可少；然而，“为促进贫困国家经济快速发展，应该把教育放在最优先考虑的位置”这一传统观点却是错的。我们很庆幸这种观点是错的，因为在这些国家建立新的教育体制，随后让足够多的人接受教育以提振经济表现，将需要两三代人的努力。某研究机构的多项研究结果一致表明，所有国家的工人生产力都可以通过在职培训从根本上得到提高，由此从根本上提高生活水平。",
    sentences: [
    { num: "①", en: "The relationship between formal education and economic growth in poor countries is widely misunderstood by economists and politicians alike.", ref: "经济学家和政治家都普遍误解了贫困国家中正规教育与经济增长之间的关系。",
      ai: { backbone: "主语 The relationship between formal education and economic growth、谓语 is understood；状语 widely", structure: ["介词短语 between formal education and economic growth：作后置定语，修饰 relationship","介词短语 in poor countries：作后置定语，修饰 formal education and economic growth","介词短语 by economists and politicians alike：引出施动者，说明被谁误解"], collocations: ["formal education（正规教育）","economic growth（经济增长）","be widely misunderstood（被普遍误解）","economists and politicians alike（经济学家和政治家都一样）"] }},
    { num: "②", en: "Progress in both areas is undoubtedly necessary for the social, political, and intellectual development of these and all other societies; however, the conventional view that education should be one of the very highest priorities for promoting rapid economic development in poor countries is wrong.", ref: "毫无疑问，这两个领域的进步对于这些国家以及其他所有国家的社会、政治及智力发展而言都必不可少；然而，“为促进贫困国家经济快速发展，应该把教育放在最优先考虑的位置”这一传统观点却是错的。",
      ai: { backbone: "并列句：句1 主语 Progress in both areas、谓语 is necessary；句2 主语 the conventional view、谓语 is wrong", structure: ["介词短语 in both areas：作后置定语，修饰 Progress","介词短语 for the social, political, and intellectual development：说明必要性针对的对象","插入语 however：表转折","定语从句 that education should be one of the very highest priorities：修饰 the conventional view","介词短语 for promoting rapid economic development in poor countries：作后置定语，修饰 priorities"], collocations: ["be necessary for（对……是必要的）","the conventional view（传统观点）","highest priorities（最高优先事项）","promote rapid economic development（促进经济快速发展）"] }},
    { num: "③", en: "We are fortunate that it is, because building new educational systems there and putting enough people through them to improve economic performance would require two or three generations.", ref: "我们很庆幸这种观点是错的，因为在这些国家建立新的教育体制，随后让足够多的人接受教育以提振经济表现，将需要两三代人的努力。",
      ai: { backbone: "主语 We、谓语 are fortunate、原因状语从句 that it is；主句说明原因", structure: ["原因状语从句 that it is：说明幸运的原因（it 指代前文的 conventional view 是错的）","原因状语从句 because building new educational systems there...would require two or three generations：进一步解释为何幸运","动名词短语 building new educational systems there：作主语","动名词短语 putting enough people through them：与 building 并列，作主语","不定式短语 to improve economic performance：作目的状语"], collocations: ["be fortunate that（幸运的是）","build educational systems（建立教育体系）","put through（使……完成）","improve economic performance（提高经济表现）"] }},
    { num: "④", en: "The findings of a research institution have consistently shown that workers in all countries can be trained on the job to achieve radically higher productivity and, as a result, radically higher standards of living.", ref: "某研究机构的多项研究结果一致表明，所有国家的工人生产力都可以通过在职培训从根本上得到提高，由此从根本上提高生活水平。",
      ai: { backbone: "主语 The findings of a research institution、谓语 have shown、宾语从句 that workers can be trained to achieve higher productivity", structure: ["介词短语 of a research institution：作后置定语，修饰 findings","宾语从句 that workers in all countries can be trained on the job：作 have shown 的宾语","不定式短语 to achieve radically higher productivity：作目的状语","并列成分 and, as a result, radically higher standards of living：与 higher productivity 并列"], collocations: ["the findings of（……的发现）","on the job（在职）","achieve higher productivity（实现更高的生产率）","standards of living（生活水平）","as a result（因此）"] }}
    ]
  },
  {
    day: 79,
    type: "英一",
    source: "2009 Text 3",
    zh: "具有讽刺意味的是，这一观点最先在美国得到印证。不久前，随着美国经济进入衰退期而日本经济处于泡沫破灭前的顶峰，美国劳动大军被嘲笑受教育水平低，（这一点）被看作是其经济表现不振的主要原因之一。从过去到现在，日本在汽车装配生产力方面一直都保持全球领先地位。然而研究表明，本田、日产、丰田（三家日本汽车商）在美国的工厂达到了日本本土工厂生产力的约 95%，这归功于美国工人接受的在职培训。",
    sentences: [
    { num: "①", en: "Ironically, the first evidence for this idea appeared in the United States.", ref: "具有讽刺意味的是，这一观点最先在美国得到印证。",
      ai: { backbone: "主语 the first evidence、谓语 appeared；地点状语 in the United States", structure: ["评注性状语 Ironically：作状语，表示“讽刺的是”","介词短语 for this idea：作后置定语，修饰 evidence"], collocations: ["ironically（讽刺的是）","the first evidence for（……的首个证据）"] }},
    { num: "②", en: "Not long ago, with the country entering a recession and Japan at its pre-bubble peak, the U.S. workforce was derided as poorly educated and one of primary causes of the poor U.S. economic performance.", ref: "不久前，随着美国经济进入衰退期而日本经济处于泡沫破灭前的顶峰，美国劳动大军被嘲笑受教育水平低，（这一点）被看作是其经济表现不振的主要原因之一。",
      ai: { backbone: "主语 the U.S. workforce、谓语 was derided、宾补 as poorly educated and one of primary causes", structure: ["时间状语 Not long ago：说明时间","独立主格结构 with the country entering a recession and Japan at its pre-bubble peak：作伴随状语，交代时代背景","介词短语 of the poor U.S. economic performance：作后置定语，修饰 one of primary causes"], collocations: ["not long ago（不久前）","enter a recession（进入衰退）","pre-bubble peak（泡沫前的顶峰）","be derided as（被嘲笑为）","poorly educated（受教育程度低的）"] }},
    { num: "③", en: "Japan was, and remains, the global leader in automotive-assembly productivity.", ref: "从过去到现在，日本在汽车装配生产力方面一直都保持全球领先地位。",
      ai: { backbone: "主语 Japan、谓语 was, and remains、表语 the global leader", structure: ["介词短语 in automotive-assembly productivity：说明领先的领域","并列谓语 was, and remains：表示过去是且现在仍是"], collocations: ["the global leader in（在……方面的全球领先者）","automotive-assembly productivity（汽车组装生产率）"] }},
    { num: "④", en: "Yet the research revealed that the U.S. factories of Honda, Nissan, and Toyota achieved about 95 percent of the productivity of their Japanese counterparts — a result of the training that U.S. workers received on the job.", ref: "然而研究表明，本田、日产、丰田（三家日本汽车商）在美国的工厂达到了日本本土工厂生产力的约 95%，这归功于美国工人接受的在职培训。",
      ai: { backbone: "主句：主语 the research、谓语 revealed、宾语从句 that the U.S. factories achieved about 95 percent", structure: ["宾语从句 that the U.S. factories of Honda, Nissan, and Toyota achieved about 95 percent of the productivity of their Japanese counterparts：作 revealed 的宾语","名词短语 a result of the training：作同位语，概括前文结果","定语从句 that U.S. workers received on the job：修饰 the training"], collocations: ["reveal that（揭示出）","Japanese counterparts（日本同行）","a result of（……的结果）","receive training（接受培训）"] }}
    ]
  },
  {
    day: 80,
    type: "英一",
    source: "2009 Text 3",
    zh: "更近些时候，研究者在调查住宅建设时发现，尽管建筑业的工作很复杂，但是德克萨斯州体斯敦市那些不识字、不会说英语的墨西哥工人却始终能达到劳动生产力的最佳实践标准。",
    sentences: [
    { num: "①", en: "More recently, while examining housing construction, the researchers discovered that illiterate, non-English-speaking Mexican workers in Houston, Texas, consistently met best-practice labor productivity standards despite the complexity of the building industry’s work.", ref: "更近些时候，研究者在调查住宅建设时发现，尽管建筑业的工作很复杂，但是德克萨斯州体斯敦市那些不识字、不会说英语的墨西哥工人却始终能达到劳动生产力的最佳实践标准。",
      ai: { backbone: "主句：主语 the researchers、谓语 discovered、宾语从句 that illiterate workers consistently met standards", structure: ["时间状语 More recently：说明时间","时间状语从句 while examining housing construction：表示“在……时”","宾语从句 that illiterate, non-English-speaking Mexican workers in Houston, Texas, consistently met best-practice labor productivity standards：作 discovered 的宾语","介词短语 despite the complexity of the building industry’s work：作让步状语"], collocations: ["more recently（更近些时候）","illiterate workers（不识字的工人）","meet standards（达到标准）","best-practice（最佳实践的）","despite the complexity（尽管复杂）"] }}
    ]
  },
  {
    day: 81,
    type: "英一",
    source: "2009 Text 3",
    zh: "（那么）教育与经济发展之间的真正关联是什么？我们不得不猜想即使政府不强制推行教育，经济持续增长也会促进教育发展。毕竟，教育最初就是这样产生的。一万年前，当我们的祖先依靠狩猎、采集为生的时候，他们根本没有琢磨除觅食外其他事情的时间。只有当人类开始更有效率地获取食物之后，他们才有考虑其他事情的时间。",
    sentences: [
    { num: "①", en: "What is the real relationship between education and economic development?", ref: "（那么）教育与经济发展之间的真正关联是什么？",
      ai: { backbone: "主语 What is the real relationship、谓语 is；表语 What 从句", structure: ["疑问代词 What：作主语","介词短语 between education and economic development：作后置定语，修饰 relationship"], collocations: ["the real relationship between（……之间的真实关系）","economic development（经济发展）"] }},
    { num: "②", en: "We have to suspect that continuing economic growth promotes the development of education even when governments don’t force it.", ref: "我们不得不猜想即使政府不强制推行教育，经济持续增长也会促进教育发展。",
      ai: { backbone: "主语 We、谓语 have to suspect、宾语从句 that continuing economic growth promotes the development of education", structure: ["宾语从句 that continuing economic growth promotes the development of education：作 suspect 的宾语","让步状语从句 even when governments don’t force it：表示即使政府不推动","动名词短语 continuing economic growth：作宾语从句的主语"], collocations: ["have to suspect（不得不怀疑）","continuing economic growth（持续的经济增长）","promote the development of（促进……的发展）","force it（强制推行）"] }},
    { num: "③", en: "After all, that’s how education got started.", ref: "毕竟，教育最初就是这样产生的。",
      ai: { backbone: "主语 that、谓语 got started；方式状语 After all", structure: ["评注性状语 After all：作状语，表示“毕竟”","that 指代 education"], collocations: ["after all（毕竟）","get started（开始，起源）"] }},
    { num: "④", en: "When our ancestors were hunters and gatherers 10,000 years ago, they didn’t have time to wonder much about anything besides finding food.", ref: "一万年前，当我们的祖先依靠狩猎、采集为生的时候，他们根本没有琢磨除觅食外其他事情的时间。",
      ai: { backbone: "主句：主语 they、谓语 didn’t have、宾语 time；时间状语从句 When our ancestors were hunters and gatherers", structure: ["时间状语从句 When our ancestors were hunters and gatherers 10,000 years ago：说明时间","不定式短语 to wonder much about anything besides finding food：作后置定语，修饰 time"], collocations: ["hunters and gatherers（狩猎采集者）","have time to do（有时间做某事）","wonder about（对……感到好奇）","besides（除了……之外）"] }},
    { num: "⑤", en: "Only when humanity began to get its food in a more productive way was there time for other things.", ref: "只有当人类开始更有效率地获取食物之后，他们才有考虑其他事情的时间。",
      ai: { backbone: "主语 there、谓语 was、表语 time for other things（倒装：Only + 状语从句置于句首引起部分倒装）", structure: ["时间状语从句 Only when humanity began to get its food in a more productive way：置于句首，引起主句倒装，表示“只有当……时”","介词短语 in a more productive way：说明获取食物的方式"], collocations: ["only when（只有当……时）","get food（获取食物）","in a productive way（以高效的方式）"] }}
    ]
  },
  {
    day: 82,
    type: "英一",
    source: "2009 Text 3",
    zh: "随着教育的改善，人类生产力潜能也得到了提高。当竞争环境迫使我们的祖先去获得这种潜能时，他们反过来又能受得起更多教育。对出色经济表现所要求的复杂政治体制来说，这种日益提高的教育水平可能是一个必要但不充分条件。因此，如果不进行“只能靠更广泛正规教育才有可能实现”的政治变革，贫困国家可能无法摆脱其贫困牢笼。但是，正规教育的缺乏并不会限制发展中国家劳动人口在可预见的未来从本质上提高生产力。相反，对生产力提高的限制解释了为什么这些国家的教育没能发展得更快。",
    sentences: [
    { num: "①", en: "As education improved, humanity’s productivity potential increased as well.", ref: "随着教育的改善，人类生产力潜能也得到了提高。",
      ai: { backbone: "主句：主语 humanity’s productivity potential、谓语 increased；时间状语从句 As education improved", structure: ["时间状语从句 As education improved：表示“随着教育的改进”","介词短语 as well：作状语，表示“也”"], collocations: ["as...improved（随着……的改进）","productivity potential（生产潜力）","as well（也）"] }},
    { num: "②", en: "When the competitive environment pushed our ancestors to achieve that potential, they could in turn afford more education.", ref: "当竞争环境迫使我们的祖先去获得这种潜能时，他们反过来又能受得起更多教育。",
      ai: { backbone: "主句：主语 they、谓语 could afford、宾语 more education；时间状语从句 When the competitive environment pushed our ancestors", structure: ["时间状语从句 When the competitive environment pushed our ancestors to achieve that potential：说明时间","不定式短语 to achieve that potential：作宾语补足语，说明推动的内容","介词短语 in turn：作状语，表示“反过来”"], collocations: ["competitive environment（竞争环境）","achieve potential（发挥潜能）","in turn（反过来）","afford more education（负担得起更多教育）"] }},
    { num: "③", en: "This increasingly high level of education is probably a necessary, but not a sufficient, condition for the complex political systems required by advanced economic performance.", ref: "对出色经济表现所要求的复杂政治体制来说，这种日益提高的教育水平可能是一个必要但不充分条件。",
      ai: { backbone: "主语 This increasingly high level of education、谓语 is、表语 a necessary, but not a sufficient, condition", structure: ["介词短语 for the complex political systems：说明条件针对的对象","过去分词短语 required by advanced economic performance：作后置定语，修饰 political systems"], collocations: ["a necessary, but not sufficient, condition（必要但不充分的条件）","complex political systems（复杂的政治体系）","advanced economic performance（先进的经济表现）"] }},
    { num: "④", en: "Thus poor countries might not be able to escape their poverty traps without political changes that may be possible only with broader formal education.", ref: "因此，如果不进行“只能靠更广泛正规教育才有可能实现”的政治变革，贫困国家可能无法摆脱其贫困牢笼。",
      ai: { backbone: "主句：主语 poor countries、谓语 might not be able to escape、宾语 their poverty traps；方式状语 without political changes", structure: ["介词短语 without political changes：作条件状语","定语从句 that may be possible only with broader formal education：修饰 political changes"], collocations: ["escape poverty traps（摆脱贫困陷阱）","broader formal education（更广泛的正规教育）"] }},
    { num: "⑤", en: "A lack of formal education, however, doesn’t constrain the ability of the developing world’s workforce to substantially improve productivity for the foreseeable future.", ref: "但是，正规教育的缺乏并不会限制发展中国家劳动人口在可预见的未来从本质上提高生产力。",
      ai: { backbone: "主语 A lack of formal education、谓语 doesn’t constrain、宾语 the ability", structure: ["插入语 however：表转折","介词短语 of the developing world’s workforce：作后置定语，修饰 ability","不定式短语 to substantially improve productivity：作后置定语，修饰 ability","介词短语 for the foreseeable future：作时间状语"], collocations: ["a lack of（缺乏）","constrain the ability（限制能力）","the developing world’s workforce（发展中世界的劳动力）","for the foreseeable future（在可预见的未来）"] }},
    { num: "⑥", en: "On the contrary, constraints on improving productivity explain why education isn’t developing more quickly there than it is.", ref: "相反，对生产力提高的限制解释了为什么这些国家的教育没能发展得更快。",
      ai: { backbone: "主句：主语 constraints on improving productivity、谓语 explain、宾语从句 why education isn’t developing more quickly", structure: ["介词短语 On the contrary：作状语，表示“相反”","宾语从句 why education isn’t developing more quickly there than it is：作 explain 的宾语","介词短语 on improving productivity：作后置定语，修饰 constraints"], collocations: ["on the contrary（相反）","constraints on doing（对……的限制）","develop quickly（快速发展）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "sufficientadj.足够的", word: "sufficient", meaning: "adj.足够的" },
      { raw: "sufficientcondition充分条件", word: "sufficientcondition充分条件", meaning: "" },
      { raw: "necessarycondition必要条件（requirement）", word: "necessarycondition必要条件（requirement）", meaning: "" }
    ],
        split: "Thisincreasinglyhighlevel//ofeducationisprobablyanecessary,//butnota sufficient,//condition//forthecomplexpoliticalsystems//requiredbyadvanced economicperformance.",
        grammar: ["主干：主+系+表", "forthe...介词短语作状语", "requiredby...过去分词短语作后置定语", "anecessarybutnotasufficientcondition必要非充分条件"],
        ref: "这种日益提高的教育水平，对于经济高速发展所需的复杂政治体制，可能是一个必要非充分条件。句型(逻辑关系)提取：AisanecessarybutnotasufficientconditionforBA是B的必要非充分条件（A不能推BB可以推A）AisanecessarybutnotasufficientconditionforBrequiredbyC（A不能推BB不能推C）"
      },
      {
        sentNum: "⑥",
        vocab: [
      { raw: "constraintn.限制，束缚", word: "constraint", meaning: "n.限制，束缚" },
      { raw: "productivityn.生产力", word: "productivity", meaning: "n.生产力" },
      { raw: "onthecontrary相反", word: "onthecontrary相反", meaning: "" }
    ],
        split: "Onthecontrary,//constraints//onimprovingproductivityexplain//whyeducation isn’tdevelopingmorequicklythere//thanitis.",
        grammar: ["主干：主+谓+宾从", "on...介词短语作后置定语", "than引导状语从句itis后省略了developing，补充完整为：thanitis", "developing，这句完整意思为“教育没能发展得更快//比现在（教育发展的速度）”", "AexplainBA解释B=A是B的原因，注意本句的因果关系"],
        ref: "相反，生产率的提高受到限制则解释了为什么（这些国家的）教育没能发展得更快。"
      }
    ]
  },
  {
    day: 83,
    type: "英一",
    source: "2009 Text 4",
    zh: "（美洲）新大陆历史中被研究得最为彻底的知识分子是 17 世纪新英格兰的牧师和政治领袖。根据权威的美国哲学史记载，在殖民地时期的美洲，没有其他地区“如此注重文化爱好”。根据许多书籍和文献记载，新英格兰领导者确立了美国文化生活中逐渐发展并占据主流地位的清教传统的基本主题和关注重点。",
    sentences: [
    { num: "①", en: "The most thoroughly studied intellectuals in the history of the new world are the ministers and political leaders of seventeenth-century New England.", ref: "（美洲）新大陆历史中被研究得最为彻底的知识分子是 17 世纪新英格兰的牧师和政治领袖。",
      ai: { backbone: "主语 The most thoroughly studied intellectuals、谓语 are、表语 the ministers and political leaders", structure: ["介词短语 in the history of the new world：作后置定语，修饰 intellectuals","介词短语 of seventeenth-century New England：作后置定语，修饰 ministers and political leaders","副词短语 most thoroughly studied：作定语，修饰 intellectuals，表示“被研究最透彻的”"], collocations: ["thoroughly studied（被深入研究过的）","ministers and political leaders（牧师和政治领袖）","seventeenth-century New England（17世纪的新英格兰）"] }},
    { num: "②", en: "According to the standard history of American philosophy, nowhere else in colonial America was “so much importance attached to intellectual pursuits.”", ref: "根据权威的美国哲学史记载，在殖民地时期的美洲，没有其他地区“如此注重文化爱好”。",
      ai: { backbone: "倒装句：主语 “so much importance”、谓语 was attached、状语 nowhere else in colonial America", structure: ["介词短语 According to the standard history of American philosophy：作状语，说明信息来源","介词短语 to intellectual pursuits：与 attached 搭配，说明“如此多的重视被给予智力追求”","否定状语 nowhere else 置于句首引起部分倒装"], collocations: ["according to（根据）","nowhere else（别处都没有）","attach importance to（重视）","intellectual pursuits（智力追求）"] }},
    { num: "③", en: "According to many books and articles, New England’s leaders established the basic themes and preoccupations of an unfolding, dominant Puritan tradition in American intellectual life.", ref: "根据许多书籍和文献记载，新英格兰领导者确立了美国文化生活中逐渐发展并占据主流地位的清教传统的基本主题和关注重点。",
      ai: { backbone: "主语 New England’s leaders、谓语 established、宾语 the basic themes and preoccupations", structure: ["介词短语 According to many books and articles：作状语，说明信息来源","介词短语 of an unfolding, dominant Puritan tradition：作后置定语，修饰 themes and preoccupations","介词短语 in American intellectual life：说明地点/领域"], collocations: ["according to（根据）","basic themes（基本主题）","dominant Puritan tradition（占主导地位的清教传统）","intellectual life（思想生活）"] }}
    ]
  },
  {
    day: 84,
    type: "英一",
    source: "2009 Text 4",
    zh: "以这种方法研究新英格兰人通常意味着从清教徒的神学新观念及其对教会的独特看法入手——这些都是我们不可忽略的重要主题。但是为了与我们对美国南部地区文化生活的考察保持一致，我们可以将这些最初的清教徒视为欧洲文化的承载者，他们在适应新大陆的环境。在追求文明礼仪和精湛技艺这些被广泛认可的理想的过程中，新英格兰殖民地曾是重大事件的发生地。",
    sentences: [
    { num: "①", en: "To take this approach to the New Englanders normally means to start with the Puritans’ theological innovations and their distinctive ideas about the church—important subjects that we may not neglect.", ref: "以这种方法研究新英格兰人通常意味着从清教徒的神学新观念及其对教会的独特看法入手——这些都是我们不可忽略的重要主题。",
      ai: { backbone: "主语 To take this approach to the New Englanders、谓语 means、宾语 to start with the Puritans’ theological innovations", structure: ["不定式短语 To take this approach to the New Englanders：作主语","不定式短语 to start with the Puritans’ theological innovations and their distinctive ideas about the church：作宾语","破折号后的名词短语 important subjects that we may not neglect：作同位语，说明前面内容的重要性","定语从句 that we may not neglect：修饰 subjects"], collocations: ["take an approach to（对……采取某种方法）","start with（从……开始）","theological innovations（神学创新）","distinctive ideas about（对……的独特看法）","important subjects（重要主题）"] }},
    { num: "②", en: "But in keeping with our examination of southern intellectual life, we may consider the original Puritans as carriers of European culture, adjusting to New World circumstances.", ref: "但是为了与我们对美国南部地区文化生活的考察保持一致，我们可以将这些最初的清教徒视为欧洲文化的承载者，他们在适应新大陆的环境。",
      ai: { backbone: "主句：主语 we、谓语 may consider、宾语 the original Puritans、宾补 as carriers of European culture", structure: ["介词短语 in keeping with our examination of southern intellectual life：作状语，表示“与……保持一致”","现在分词短语 adjusting to New World circumstances：作后置定语，修饰 carriers","介词短语 of European culture：作后置定语，修饰 carriers"], collocations: ["in keeping with（与……一致）","consider...as（把……看作）","carriers of culture（文化的传播者）","adjust to（适应）","New World circumstances（新世界的情况）"] }},
    { num: "③", en: "The New England colonies were the scenes of important episodes in the pursuit of widely understood ideals of civility and virtuosity.", ref: "在追求文明礼仪和精湛技艺这些被广泛认可的理想的过程中，新英格兰殖民地曾是重大事件的发生地。",
      ai: { backbone: "主语 The New England colonies、谓语 were、表语 the scenes of important episodes", structure: ["介词短语 in the pursuit of widely understood ideals of civility and virtuosity：说明在何种追求中"], collocations: ["be the scenes of（是……的发生地）","in the pursuit of（在追求……的过程中）","ideals of civility（文明理想）"] }}
    ]
  },
  {
    day: 85,
    type: "英一",
    source: "2009 Text 4",
    zh: "马萨诸塞湾的早期移民包括在英格兰受过良好教育并具有相当影响力的人。除了 1629 年后十年中来到马萨诸塞教会的约 90 位博学牧师之外，还有像约翰·温思罗普这样的政治领袖，他是一位受过良好教育的绅士、律师，远航到波士顿之前曾担任王室官员。这些人大规模著书并出版，为新大陆、旧大陆读者所熟悉，为新英格兰营造了一种热切求知的氛围。",
    sentences: [
    { num: "①", en: "The early settlers of Massachusetts Bay included men of impressive education and influence in England.", ref: "马萨诸塞湾的早期移民包括在英格兰受过良好教育并具有相当影响力的人。",
      ai: { backbone: "主语 The early settlers of Massachusetts Bay、谓语 included、宾语 men of impressive education and influence", structure: ["介词短语 of Massachusetts Bay：作后置定语，修饰 settlers","介词短语 of impressive education and influence：作后置定语，修饰 men","介词短语 in England：说明这些人的原籍"], collocations: ["early settlers（早期定居者）","impressive education and influence（令人印象深刻的教育背景和影响力）"] }},
    { num: "②", en: "Besides the ninety or so learned ministers who came to Massachusetts churches in the decade after 1629, there were political leaders like John Winthrop, an educated gentleman, lawyer, and official of the Crown before he journeyed to Boston.", ref: "除了 1629 年后十年中来到马萨诸塞教会的约 90 位博学牧师之外，还有像约翰·温思罗普这样的政治领袖，他是一位受过良好教育的绅士、律师，远航到波士顿之前曾担任王室官员。",
      ai: { backbone: "主语 there、谓语 were、表语 political leaders like John Winthrop", structure: ["介词短语 Besides the ninety or so learned ministers who came to Massachusetts churches：作状语，表示“除……之外”","定语从句 who came to Massachusetts churches in the decade after 1629：修饰 ministers","介词短语 in the decade after 1629：说明时间","名词短语 an educated gentleman, lawyer, and official of the Crown：作同位语，说明 John Winthrop 的身份","时间状语从句 before he journeyed to Boston：说明时间"], collocations: ["besides（除……之外）","learned ministers（有学问的牧师）","political leaders（政治领袖）","an educated gentleman（受过教育的绅士）","official of the Crown（王室官员）"] }},
    { num: "③", en: "These men wrote and published extensively, reaching both New World and Old World audiences, and giving New England an atmosphere of intellectual earnestness.", ref: "这些人大规模著书并出版，为新大陆、旧大陆读者所熟悉，为新英格兰营造了一种热切求知的氛围。",
      ai: { backbone: "主语 These men、谓语 wrote and published、状语 extensively", structure: ["现在分词短语 reaching both New World and Old World audiences：作伴随状语","现在分词短语 giving New England an atmosphere of intellectual earnestness：与 reaching 并列，作伴随状语","介词短语 of intellectual earnestness：作后置定语，修饰 atmosphere"], collocations: ["publish extensively（大量出版）","reach audiences（触及读者群）","an atmosphere of（……的氛围）","intellectual earnestness（求知的认真态度）"] }}
    ]
  },
  {
    day: 86,
    type: "英一",
    source: "2009 Text 4",
    zh: "然而，我们不该忘记，大多数新英格兰人并未受过良好教育。尽管很少有手工艺者和农民——更不用说侍从和仆人——留下可供分析的书面作品，但他们的观点显然不那么足够理智。他们的思维往往带有传统的迷信色彩。一位名叫约翰·丹奈的裁缝，于 17 世纪 30 年代后期移居新大陆，他所留下的关于离开英格兰原因的叙述里充满了神迹。性的困惑、经济挫折和宗教期望——所有这些都在某一关键性时刻一齐涌来，他打开《圣经》，告诉父亲他读到的第一行字将决定他的命运，接着便读到了以下神奇的语句:“从他们中走出来吧，不要沾染不洁之物，我愿成为你的上帝，你就是我的子民。人们会纳闷，丹奈在清教教会里听那些精心诠释的布道文时作何感想。另一方面，很多移民并没有丹奈这么虔诚的宗教信仰，正如某一牧师在与沿海居民打交道时所意识到的那样，那些人嘲弄地说他们来新大陆并非为了宗教。“我们的主要目的是捕鱼。”",
    sentences: [
    { num: "①", en: "We should not forget, however, that most New Englanders were less well educated.", ref: "然而，我们不该忘记，大多数新英格兰人并未受过良好教育。",
      ai: { backbone: "主句：主语 we、谓语 should not forget、宾语从句 that most New Englanders were less well educated", structure: ["插入语 however：表转折","宾语从句 that most New Englanders were less well educated：作 forget 的宾语"], collocations: ["should not forget（不应忘记）","be less well educated（受教育程度较低）"] }},
    { num: "②", en: "While few crafts men or farmers, let alone dependents and servants, left literary compositions to be analyzed, it is obvious that their views were less fully intellectualized.", ref: "尽管很少有手工艺者和农民——更不用说侍从和仆人——留下可供分析的书面作品，但他们的观点显然不那么足够理智。",
      ai: { backbone: "主句：主语 their views、谓语 were less fully intellectualized；让步状语从句 While few crafts men or farmers left literary compositions", structure: ["让步状语从句 While few crafts men or farmers, let alone dependents and servants, left literary compositions to be analyzed：表示让步","插入语 let alone dependents and servants：表示“更不用说”","不定式短语 to be analyzed：作后置定语，修饰 literary compositions","主句 it is obvious：it 为形式主语，真正主语为 that 从句"], collocations: ["let alone（更不用说）","dependents and servants（家属和仆人）","literary compositions（文学作品）","be intellectualized（被理性化）"] }},
    { num: "③", en: "Their thinking often had a traditional superstitious quality.", ref: "他们的思维往往带有传统的迷信色彩。",
      ai: { backbone: "主语 Their thinking、谓语 had、宾语 a traditional superstitious quality", structure: ["形容词短语 traditional superstitious：作定语，修饰 quality"], collocations: ["a superstitious quality（迷信色彩）","traditional（传统的）"] }},
    { num: "④", en: "A tailor named John Dane, who emigrated in the late 1630s, left an account of his reasons for leaving England that is filled with signs.", ref: "一位名叫约翰·丹奈的裁缝，于 17 世纪 30 年代后期移居新大陆，他所留下的关于离开英格兰原因的叙述里充满了神迹。",
      ai: { backbone: "主语 A tailor named John Dane、谓语 left、宾语 an account of his reasons；非限制性定语从句 who emigrated", structure: ["过去分词短语 named John Dane：作后置定语，修饰 A tailor","非限制性定语从句 who emigrated in the late 1630s：修饰 John Dane","介词短语 for leaving England：作后置定语，修饰 reasons","定语从句 that is filled with signs：修饰 an account"], collocations: ["leave an account of（留下……的记述）","be filled with（充满）","signs（征兆，迹象）"] }},
    { num: "⑤", en: "Sexual confusion, economic frustrations, and religious hope — all came together in a decisive moment when he opened the Bible, told his father that the first line he saw would settle his fate, and read the magical words: “Come out from among them, touch no unclean thing, and I will be your God and you shall be my people.”", ref: "性的困惑、经济挫折和宗教期望——所有这些都在某一关键性时刻一齐涌来，他打开《圣经》，告诉父亲他读到的第一行字将决定他的命运，接着便读到了以下神奇的语句:“从他们中走出来吧，不要沾染不洁之物，我愿成为你的上帝，你就是我的子民。",
      ai: { backbone: "主句：主语 Sexual confusion, economic frustrations, and religious hope、谓语 came together；时间状语 in a decisive moment", structure: ["破折号后的内容 all came together in a decisive moment：概括说明三者汇聚","时间状语从句 when he opened the Bible, told his father that the first line he saw would settle his fate, and read the magical words：修饰 moment","并列谓语 opened, told, and read：三个并列动作","宾语从句 that the first line he saw would settle his fate：作 told 的宾语","冒号后的引语 “Come out from among them, touch no unclean thing, and I will be your God and you shall be my people.”：作 the magical words 的同位语"], collocations: ["sexual confusion（性困惑）","economic frustrations（经济挫折）","religious hope（宗教希望）","come together（汇聚在一起）","settle one’s fate（决定某人的命运）"] }},
    { num: "⑥", en: "One wonders what Dane thought of the careful sermons explaining the Bible that he heard in Puritan churches.", ref: "人们会纳闷，丹奈在清教教会里听那些精心诠释的布道文时作何感想。",
      ai: { backbone: "主语 One、谓语 wonders、宾语从句 what Dane thought of the careful sermons", structure: ["宾语从句 what Dane thought of the careful sermons：作 wonders 的宾语","现在分词短语 explaining the Bible：作后置定语，修饰 sermons","定语从句 he heard in Puritan churches：修饰 sermons（省略了关系代词 that）"], collocations: ["wonder what...thought of（想知道……怎么看待）","careful sermons（精心准备的布道）","Puritan churches（清教教堂）"] }},
    { num: "⑦", en: "Meanwhile, many settlers had slighter religious commitments than Dane’s, as one clergyman learned in confronting folk along the coast who mocked that they had not come to the New World for religion.", ref: "另一方面，很多移民并没有丹奈这么虔诚的宗教信仰，正如某一牧师在与沿海居民打交道时所意识到的那样，那些人嘲弄地说他们来新大陆并非为了宗教。",
      ai: { backbone: "主句：主语 many settlers、谓语 had、宾语 slighter religious commitments；时间状语 Meanwhile", structure: ["介词短语 than Dane’s：作比较状语","时间状语从句 as one clergyman learned in confronting folk along the coast：说明信息来源","定语从句 who mocked that they had not come to the New World for religion：修饰 folk","宾语从句 that they had not come to the New World for religion：作 mocked 的宾语"], collocations: ["religious commitments（宗教虔诚度）","along the coast（沿海一带）","mock that（嘲笑道）","the New World（新世界）"] }},
    { num: "⑧", en: "“Our main end was to catch fish.”", ref: "“我们的主要目的是捕鱼。”",
      ai: { backbone: "主语 Our main end、谓语 was、宾语 to catch fish（引语）", structure: ["不定式短语 to catch fish：作表语"], collocations: ["main end（主要目的）","catch fish（捕鱼）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "craftsmenn.手工艺者，工匠", word: "craftsmen", meaning: "n.手工艺者，工匠" },
      { raw: "dependentsn.受供养者（侍从）", word: "dependents", meaning: "n.受供养者（侍从）" },
      { raw: "servantsn.仆人，佣人", word: "servants", meaning: "n.仆人，佣人" },
      { raw: "letalone更不用说", word: "letalone更不用说", meaning: "" },
      { raw: "literarycomposition文学作品，书面作品", word: "literarycomposition文学", meaning: "作品，书面作品" }
    ],
        split: "Whilefewcraftsmenorfarmers,//letalonedependentsandservants,//leftliterary compositions//tobeanalyzed,//itisobvious//thattheirviewswerelessfully intellectualized.",
        grammar: ["主干：形式主语+系+表+主语从句", "letalone更不用说", "leavev.留下在while引导的让步状语从句中作谓语", "tobeanalyzedtodo不定式作后置定语"],
        ref: "尽管很少有手工艺者和农民--更不用说侍从和仆人--留下可供分析的书面作品，但他们的观点显然不那么足够理智。"
      },
      {
        sentNum: "⑤",
        vocab: [
      { raw: "confusionn.困惑", word: "confusion", meaning: "n.困惑" },
      { raw: "frustrationn.挫折", word: "frustration", meaning: "n.挫折" },
      { raw: "decisiveadj.决定性的", word: "decisive", meaning: "adj.决定性的" },
      { raw: "theBible《圣经》", word: "theBible《圣经》", meaning: "" },
      { raw: "settleone’sfate决定某人的命运", word: "settleone’sfate决定某人的命运", meaning: "" }
    ],
        split: "",
        grammar: [],
        ref: ""
      },
      {
        sentNum: "⑥",
        vocab: [
      { raw: "sermonn.布道；说教", word: "sermon", meaning: "n.布道；说教" },
      { raw: "theBible《圣经》", word: "theBible《圣经》", meaning: "" },
      { raw: "Puritanchurch清教教会", word: "Puritanchurch清教教会", meaning: "" }
    ],
        split: "Onewonders//whatDanethoughtofthecarefulsermons//explainingtheBible //thatheheard//inPuritanchurches.",
        grammar: ["主干：主+谓+宾从", "相似句型：", "Whatdoyouthinkofit?你对此怎么看？", "Iwonderwhatyouthinkofit.我想知道你对它的看法。", "what引导宾语从句", "explaining...作后置定语（限定carefulsermons）", "that引导定语从句（限定carefulsermons）"],
        ref: "人们会纳闷，丹奈在清教教会里听那些精心诠释的布道文时作何感想。"
      }
    ]
  },
  {
    day: 87,
    type: "英一",
    source: "2010 Text 1",
    zh: "英文报纸过去 25 年间发生的所有变化中，影响最为深远的或许就是其艺术报道范围和严肃性已呈不可遏止的衰落之势。对于 40 岁以下的普通读者而言，他们难以，甚至根本无法想象一个能在大多数大都市报纸上读到高质量艺术评论的时代。然而 20 世纪出版的相当多的最具重要影响的评论文集大部分由报纸评论组成。若今日再来阅读这些文集，会惊叹于这样一个事实：里面这些广博精深的内容曾被认为适合刊登在面向大众发行的日报上。",
    sentences: [
    { num: "①", en: "Of all the changes that have taken place in English-language newspapers during the past quarter-century, perhaps the most far-reaching has been the inexorable decline in the scope and seriousness of their arts coverage.", ref: "英文报纸过去 25 年间发生的所有变化中，影响最为深远的或许就是其艺术报道范围和严肃性已呈不可遏止的衰落之势。",
      ai: { backbone: "主语 the inexorable decline、谓语 has been the most far-reaching change（省略）", structure: ["介词短语 Of all the changes that have taken place in English-language newspapers during the past quarter-century：作状语，表示“在所有变化中”","定语从句 that have taken place in English-language newspapers：修饰 changes","介词短语 during the past quarter-century：时间状语","介词短语 in the scope and seriousness of their arts coverage：作后置定语，修饰 decline"], collocations: ["take place（发生）","English-language newspapers（英文报纸）","far-reaching（影响深远的）","inexorable decline（不可遏止的衰落）","arts coverage（艺术报道）"] }},
    { num: "②", en: "It is difficult to the point of impossibility for the average reader under the age of forty to imagine a time when high-quality arts criticism could be found in most big-city newspapers.", ref: "对于 40 岁以下的普通读者而言，他们难以，甚至根本无法想象一个能在大多数大都市报纸上读到高质量艺术评论的时代。",
      ai: { backbone: "it 为形式主语、谓语 is difficult、不定式 to imagine a time；真正主语 to imagine", structure: ["介词短语 to the point of impossibility：作程度状语，表示“几乎不可能”","介词短语 for the average reader under the age of forty：说明对象","时间状语从句 when high-quality arts criticism could be found in most big-city newspapers：修饰 a time"], collocations: ["to the point of（到了……的程度）","the average reader（普通读者）","under the age of（在……岁以下）","high-quality arts criticism（高质量的艺术评论）"] }},
    { num: "③", en: "Yet a considerable number of the most significant collections of criticism published in the 20th century consisted in large part of newspaper reviews.", ref: "然而 20 世纪出版的相当多的最具重要影响的评论文集大部分由报纸评论组成。",
      ai: { backbone: "主语 a considerable number of the most significant collections of criticism、谓语 consisted in large part of、宾语 newspaper reviews", structure: ["过去分词短语 published in the 20th century：作后置定语，修饰 collections","介词短语 in large part：作状语，表示“很大程度上”"], collocations: ["a considerable number of（相当多的）","collections of criticism（评论集）","consist of（由……构成）","in large part（很大程度上）"] }},
    { num: "④", en: "To read such books today is to marvel at the fact that their learned contents were once deemed suitable for publication in general-circulation dailies.", ref: "若今日再来阅读这些文集，会惊叹于这样一个事实：里面这些广博精深的内容曾被认为适合刊登在面向大众发行的日报上。",
      ai: { backbone: "主语 To read such books today、谓语 is、表语 to marvel at the fact", structure: ["不定式短语 To read such books today：作主语","不定式短语 to marvel at the fact：作表语","同位语从句 that their learned contents were once deemed suitable for publication in general-circulation dailies：解释说明 the fact","介词短语 in general-circulation dailies：说明出版载体"], collocations: ["marvel at（对……惊叹）","learned contents（学识渊博的内容）","be deemed suitable for（被认为适合）","general-circulation dailies（大众发行的日报）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "averagereader普通读者", word: "averagereader普通读者", meaning: "" },
      { raw: "artscriticism艺术评论", word: "artscriticism艺术评论", meaning: "" }
    ],
        split: "Itisdifficult//tothepointofimpossibility//fortheaveragereader//underthe ageofforty//toimagineatime//whenhigh-qualityartscriticismcouldbefound//in mostbig-citynewspapers.",
        grammar: ["主干：主+系+表", "主干结构提炼：Itisdifficultforsb.todosth.（形式主语）", "tothepointofimpossibility介词短语作状语，表示程度修饰", "averagereader普通读者", "when引导定语从句（限定time）"],
        ref: "对于40岁以下的普通读者而言，他们难以，甚至根本无法想象一个能在大多数大都市报纸上读到高质量艺术评论的时代。"
      },
      {
        sentNum: "③",
        vocab: [
      { raw: "considerableadj.相当大的", word: "considerable", meaning: "adj.相当大的" },
      { raw: "aconsiderablenumberof大量的", word: "aconsiderablenumberof大量的", meaning: "" },
      { raw: "consistof包括，由...构成", word: "consistof包括，由...构成", meaning: "" },
      { raw: "inlargepart在很大程度上", word: "inlargepart在很大程度上", meaning: "" }
    ],
        split: "",
        grammar: [],
        ref: ""
      },
      {
        sentNum: "④",
        vocab: [
      { raw: "marvelv.感到惊奇", word: "marvel", meaning: "v.感到惊奇" },
      { raw: "learnedadj.博学的，学术性的", word: "learned", meaning: "adj.博学的，学术性的" },
      { raw: "deemv.认为", word: "deem", meaning: "v.认为" },
      { raw: "circulationn.发行，发售", word: "circulation", meaning: "n.发行，发售" },
      { raw: "dailyn.日报", word: "daily", meaning: "n.日报" },
      { raw: "marvelat...对...感到惊奇", word: "marvelat...对...感到惊奇", meaning: "" }
    ],
        split: "Toreadsuchbookstodayistomarvelatthefact//thattheirlearnedcontents wereoncedeemedsuitable//forpublication//ingeneral-circulationdailies.",
        grammar: ["主干：主+系+表", "toreadsuchbooks是todo不定式作主语", "marvelat...“对感到惊奇”，这里表示“对这个事实感到惊奇”", "that引导同位语从句，说明fact的内容"],
        ref: "若今日再来阅读这些文集，会惊叹于这样一个事实：里面这些广博精深的内容曾被认为适合刊登在面向大众发行的日报上。"
      }
    ]
  },
  {
    day: 88,
    type: "英一",
    source: "2010 Text 1",
    zh: "我们与 20 世纪初至二战前夕英国的杂感式报纸评论就更是无缘了，当时，新闻用纸价廉如土，风格独特的艺术评论被看作是对刊登它的出版物的一种装饰。在那个遥远的年代，各大报纸的评论家们会对所报道的事件撰写详尽入微的评论这被视作理所当然。他们从事的是严肃的工作，人们信任，即便是那些以轻松活泼的方式展现自己学问的评论家，如萧伯纳和欧内斯特·纽曼，也都清楚自己在做什么。这些人相信新闻写作是他们的天职，并为自己的文章能发表在日报上而感到自豪。“能够拥有足够的智慧或文学天赋能尽职尽责做好新闻写作工作本分的作家是如此之少”，纽曼写道，“以至于我不禁想把‘新闻写作’定义成为‘没读者的作家对有读者作家的蔑称’”。",
    sentences: [
    { num: "①", en: "We are even farther removed from the unfocused newspaper reviews published in England between the turn of the 20th century and the eve of World War II, at a time when newsprint was dirt-cheap and stylish arts criticism was considered an ornament to the publications in which it appeared.", ref: "我们与 20 世纪初至二战前夕英国的杂感式报纸评论就更是无缘了，当时，新闻用纸价廉如土，风格独特的艺术评论被看作是对刊登它的出版物的一种装饰。",
      ai: { backbone: "主语 We、谓语 are removed、状语 even farther", structure: ["介词短语 from the unfocused newspaper reviews published in England：说明与什么相隔更远","介词短语 between the turn of the 20th century and the eve of World War II：说明时间范围","时间状语从句 at a time when newsprint was dirt-cheap and stylish arts criticism was considered an ornament to the publications：补充说明时代背景","定语从句 in which it appeared：修饰 the publications"], collocations: ["be removed from（与……相距甚远）","the turn of the century（世纪之交）","the eve of（……的前夜）","dirt-cheap（极其便宜的）","be considered an ornament to（被视为……的装饰）"] }},
    { num: "②", en: "In those far-off days, it was taken for granted that the critics of major papers would write in detail and at length about the events they covered.", ref: "在那个遥远的年代，各大报纸的评论家们会对所报道的事件撰写详尽入微的评论这被视作理所当然。",
      ai: { backbone: "it 为形式主语、谓语 was taken for granted、主语从句 that the critics would write in detail", structure: ["介词短语 In those far-off days：时间状语","主语从句 that the critics of major papers would write in detail and at length about the events they covered：作真正主语","定语从句 they covered：修饰 the events（省略了关系代词 that）"], collocations: ["in those far-off days（在那些久远的日子里）","take it for granted that（理所当然地认为）","in detail（详细地）","at length（详尽地）"] }},
    { num: "③", en: "Theirs was a serious business, and even those reviewers who wore their learning lightly, like George Bernard Shaw and Ernest Newman, could be trusted to know what they were about.", ref: "他们从事的是严肃的工作，人们信任，即便是那些以轻松活泼的方式展现自己学问的评论家，如萧伯纳和欧内斯特·纽曼，也都清楚自己在做什么。",
      ai: { backbone: "主语 Theirs、谓语 was、表语 a serious business；并列句 and even those reviewers could be trusted", structure: ["定语从句 who wore their learning lightly：修饰 those reviewers","介词短语 like George Bernard Shaw and Ernest Newman：举例说明","宾语从句 what they were about：作 know 的宾语，表示“知道自己在做什么”"], collocations: ["wear one’s learning lightly（不卖弄学问）","be trusted to do（被信任做某事）","know what one is about（明白自己在做什么）"] }},
    { num: "④", en: "These men believed in journalism as a calling, and were proud to be published in the daily press.", ref: "这些人相信新闻写作是他们的天职，并为自己的文章能发表在日报上而感到自豪。",
      ai: { backbone: "主语 These men、谓语 believed in、宾语 journalism；并列谓语 were proud to be published", structure: ["介词短语 as a calling：说明把新闻业看作职业使命","并列谓语 were proud to be published in the daily press：表示以发表为荣"], collocations: ["believe in（信奉）","as a calling（作为一种职业使命）","be proud to do（为做某事感到自豪）","the daily press（日报）"] }},
    { num: "⑤", en: "“So few authors have brains enough or literary gift enough to keep their own end up in journalism,” Newman wrote, “that I am tempted to define ‘journalism’ as ‘a term of contempt applied by writers who are not read to writers who are’.”", ref: "“能够拥有足够的智慧或文学天赋能尽职尽责做好新闻写作工作本分的作家是如此之少”，纽曼写道，“以至于我不禁想把‘新闻写作’定义成为‘没读者的作家对有读者作家的蔑称’”。",
      ai: { backbone: "引语主句：主语 I、谓语 am tempted to define、宾语 ‘journalism’、宾补 as ‘a term of contempt’；结果状语从句 that I am tempted", structure: ["并列句 So few authors have brains enough or literary gift enough to keep their own end up in journalism：说明原因","不定式短语 to keep their own end up in journalism：作目的状语","结果状语从句 that I am tempted to define ‘journalism’ as...：由 so...that 引导","过去分词短语 applied by writers who are not read to writers who are：作后置定语，修饰 a term of contempt","定语从句 who are not read / who are：分别修饰两个 writers"], collocations: ["so...that...（如此……以致……）","keep one’s own end up（坚守立场）","be tempted to do（忍不住想做）","a term of contempt（贬义词）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "removev.移开；远离", word: "remove", meaning: "v.移开；远离" },
      { raw: "unfocusedadj.目光分散的；目的不明确的", word: "unfocused", meaning: "adj.目光分散的；目的不明确的" },
      { raw: "newsprintn.新闻用纸", word: "newsprint", meaning: "n.新闻用纸" },
      { raw: "stylishadj.时髦的，流行的", word: "stylish", meaning: "adj.时髦的，流行的" }
    ],
        split: "Weareevenfartherremoved//fromtheunfocusednewspaperreviews//published inEngland//betweentheturnofthe20thcentury//andtheeveofWorldWarII,//ata time//whennewsprintwasdirt-cheapandstylishartscriticismwasconsideredan ornament//tothepublications//inwhichitappeared.",
        grammar: ["主干：主+谓（主+系+表）", "publishedin...WorldWarII作后置定语（限定newspaperreviews）", "atatime...作同位语，解释前边的时间", "when引导定语从句（限定atime）", "inwhich引导定语从句，还原：itappearedinthepublications"],
        ref: "我们与20世纪初至二战前夕英国的杂感式报纸评论就更是无缘了，当时，新闻用纸价廉如土，风格独特的艺术评论被看作是对刊登它的出版物的一种装饰。"
      }
    ]
  },
  {
    day: 89,
    type: "英一",
    source: "2010 Text 1",
    zh: "遗憾的是，这些评论家几乎被完全遗忘了。内维尔·卡达斯从 1917 年到 1975 年去世前不久，一直在为《曼彻斯特卫报》撰写评论文章，可现在仅以板球比赛短评撰写人为人所知。但是，在他的一生之中，他也是英国最优秀的古典音乐评论家之一，他同时还是一位文体家，如此之广受赞誉，以致于其《自传》（1947 年出版）成为一本畅销书。1967 年，他受封为爵士，是第一位享有如此殊荣的音乐评论家。然而现如今，他的著作中只有一本仍在印行，他大量的乐评作品除了专业人士之外，无人知晓。前景似乎非常渺茫。前景似乎非常渺茫。早在他去世前的很长一段时间，新闻业的品味就已经改变。后现代的读者们几乎不再喜欢他所专长的极其华丽的维多利亚-爱德华时期风格的散文。更何况，音乐评论的业余传统已经迅速走向衰落。",
    sentences: [
    { num: "①", en: "Unfortunately, these critics are virtually forgotten.", ref: "遗憾的是，这些评论家几乎被完全遗忘了。",
      ai: { backbone: "主语 these critics、谓语 are forgotten；状语 virtually", structure: ["副词 virtually：作状语，表示“几乎”"], collocations: ["be virtually forgotten（几乎被遗忘）"] }},
    { num: "②", en: "Neville Cardus, who wrote for the Manchester Guardian from 1917 until shortly before his death in 1975, is now known solely as a writer of essays on the game of cricket.", ref: "内维尔·卡达斯从 1917 年到 1975 年去世前不久，一直在为《曼彻斯特卫报》撰写评论文章，可现在仅以板球比赛短评撰写人为人所知。",
      ai: { backbone: "主语 Neville Cardus、谓语 is now known、宾补 solely as a writer of essays", structure: ["非限制性定语从句 who wrote for the Manchester Guardian from 1917 until shortly before his death in 1975：修饰 Neville Cardus","介词短语 on the game of cricket：作后置定语，修饰 essays"], collocations: ["write for（为……撰稿）","shortly before（……前不久）","essays on（关于……的文章）","the game of cricket（板球运动）"] }},
    { num: "③", en: "During his lifetime, though, he was also one of England’s foremost classical-music critics, and a stylist so widely admired that his Autobiography (1947) became a best-seller.", ref: "但是，在他的一生之中，他也是英国最优秀的古典音乐评论家之一，他同时还是一位文体家，如此之广受赞誉，以致于其《自传》（1947 年出版）成为一本畅销书。",
      ai: { backbone: "主语 he、谓语 was、表语 one of England’s foremost classical-music critics；并列句 and a stylist", structure: ["时间状语 During his lifetime：说明时间","插入语 though：表转折","介词短语 so widely admired that his Autobiography (1947) became a best-seller：作后置定语，修饰 stylist","结果状语从句 that his Autobiography (1947) became a best-seller：由 so...that 引导"], collocations: ["foremost classical-music critics（最重要的古典音乐评论家）","be widely admired（广受赞赏）","become a best-seller（成为畅销书）"] }},
    { num: "④", en: "He was knighted in 1967, the first music critic to be so honored.", ref: "1967 年，他受封为爵士，是第一位享有如此殊荣的音乐评论家。",
      ai: { backbone: "主语 He、谓语 was knighted；时间状语 in 1967", structure: ["名词短语 the first music critic to be so honored：作同位语，说明他是第一个获此殊荣的音乐评论家","不定式短语 to be so honored：作后置定语，修饰 music critic"], collocations: ["be knighted（被封为爵士）","be honored（获此殊荣）"] }},
    { num: "⑤", en: "Yet only one of his books is now in print, and his vast body of writings on music is unknown save to specialists.", ref: "然而现如今，他的著作中只有一本仍在印行，他大量的乐评作品除了专业人士之外，无人知晓。",
      ai: { backbone: "并列句：句1 主语 only one of his books、谓语 is in print；句2 主语 his vast body of writings、谓语 is unknown", structure: ["转折词 Yet：表转折","介词短语 on music：作后置定语，修饰 writings","介词短语 save to specialists：作状语，表示“除了专家以外”"], collocations: ["be in print（仍在出版）","a vast body of（大量的）","save to（除了……以外）"] }},
    { num: "⑥", en: "Is there any chance that Cardus’s criticism will enjoy a revival?", ref: "前景似乎非常渺茫。",
      ai: { backbone: "主语 any chance、谓语 is；地点状语 Is there", structure: ["There be 结构的疑问形式：Is there any chance...？","同位语从句 that Cardus’s criticism will enjoy a revival：解释说明 chance 的内容"], collocations: ["is there any chance that（有没有可能……）","enjoy a revival（重新流行起来）"] }},
    { num: "⑦", en: "The prospect seems remote.", ref: "前景似乎非常渺茫。",
      ai: { backbone: "主语 The prospect、谓语 seems、表语 remote", structure: ["系动词 seems：表语 remote"], collocations: ["the prospect seems remote（前景渺茫）"] }},
    { num: "⑧", en: "Journalistic tastes had changed long before his death, and postmodern readers have little use for the richly upholstered Vicwardian prose in which he specialized.", ref: "早在他去世前的很长一段时间，新闻业的品味就已经改变。后现代的读者们几乎不再喜欢他所专长的极其华丽的维多利亚-爱德华时期风格的散文。",
      ai: { backbone: "并列句：句1 主语 Journalistic tastes、谓语 had changed；句2 主语 postmodern readers、谓语 have little use for", structure: ["时间状语 long before his death：说明时间","介词短语 for the richly upholstered Vicwardian prose：说明没有兴趣的对象","定语从句 in which he specialized：修饰 prose"], collocations: ["journalistic tastes（新闻品位）","postmodern readers（后现代读者）","have little use for（对……没什么兴趣）","specialize in（专攻）"] }},
    { num: "⑨", en: "Moreover, the amateur tradition in music criticism has been in headlong retreat.", ref: "更何况，音乐评论的业余传统已经迅速走向衰落。",
      ai: { backbone: "主语 the amateur tradition in music criticism、谓语 has been in headlong retreat", structure: ["副词 Moreover：表递进","介词短语 in music criticism：作后置定语，修饰 tradition"], collocations: ["amateur tradition（业余传统）","in headlong retreat（急速衰退）"] }}
    ]
  },
  {
    day: 90,
    type: "英一",
    source: "2010 Text 2",
    zh: "过去十年间，成千上万项专利被授给了所谓的“商业方法”。亚马逊公司因其“一键式”在线支付系统获得了一项专利。美林集团因其某种资产配置策略获得了法律保护。某发明者取得了一种提箱技术的专利。现在国家最高专利法庭似乎完全准备好缩减商业方法专利的数量，这类专利自十年前首次获批以来就一直备受争议。在一次令知识产权律师们议论纷纷的举措中，美国联邦巡回上诉法院宣称，它将利用一起特殊案件对商业方法专利开展广泛复审。这个被熟知为比尔斯基案的案件“事关重大”，密苏里大学法学院的丹尼斯·D·克劳奇说，它“有撤销一整类专利的潜力”。",
    sentences: [
    { num: "①", en: "Over the past decade, thousands of patents have been granted for what are called business methods.", ref: "过去十年间，成千上万项专利被授给了所谓的“商业方法”。",
      ai: { backbone: "主语 thousands of patents、谓语 have been granted；时间状语 Over the past decade", structure: ["介词短语 for what are called business methods：作状语，说明授予的对象","宾语从句 what are called business methods：作介词 for 的宾语"], collocations: ["over the past decade（在过去的十年里）","thousands of（成千上万）","patents（专利）","be granted（被授予）","business methods（商业方法）"] }},
    { num: "②", en: "Amazon.com received one for its “one-click” online payment system.", ref: "亚马逊公司因其“一键式”在线支付系统获得了一项专利。",
      ai: { backbone: "主语 Amazon.com、谓语 received、宾语 one", structure: ["介词短语 for its “one-click” online payment system：说明专利对应的系统","one 指代 a patent"], collocations: ["online payment system（在线支付系统）","one-click（一键式）"] }},
    { num: "③", en: "Merrill Lynch got legal protection for an asset allocation strategy.", ref: "美林集团因其某种资产配置策略获得了法律保护。",
      ai: { backbone: "主语 Merrill Lynch、谓语 got、宾语 legal protection", structure: ["介词短语 for an asset allocation strategy：说明保护的对象"], collocations: ["get legal protection（获得法律保护）","asset allocation strategy（资产配置策略）"] }},
    { num: "④", en: "One inventor patented a technique for lifting a box.", ref: "某发明者取得了一种提箱技术的专利。",
      ai: { backbone: "主语 One inventor、谓语 patented、宾语 a technique", structure: ["介词短语 for lifting a box：作后置定语，修饰 technique"], collocations: ["patent a technique（为一项技术申请专利）"] }},
    { num: "⑤", en: "Now the nation’s top patent court appears completely ready to scale back on business-method patents, which have been controversial ever since they were first authorized 10 years ago.", ref: "现在国家最高专利法庭似乎完全准备好缩减商业方法专利的数量，这类专利自十年前首次获批以来就一直备受争议。",
      ai: { backbone: "主语 the nation’s top patent court、谓语 appears ready to scale back on、宾语 business-method patents", structure: ["副词 Now：时间状语","非限制性定语从句 which have been controversial：修饰 business-method patents","时间状语从句 ever since they were first authorized 10 years ago：说明争议由来"], collocations: ["top patent court（最高专利法院）","scale back on（缩减）","business-method patents（商业方法专利）","be controversial（有争议的）","be authorized（被授权）"] }},
    { num: "⑥", en: "In a move that has intellectual-property lawyers abuzz, the U.S. Court of Appeals for the Federal Circuit said it would use a particular case to conduct a broad review of business-method patents.", ref: "在一次令知识产权律师们议论纷纷的举措中，美国联邦巡回上诉法院宣称，它将利用一起特殊案件对商业方法专利开展广泛复审。",
      ai: { backbone: "主句：主语 the U.S. Court of Appeals for the Federal Circuit、谓语 said、宾语从句 it would use a particular case", structure: ["介词短语 In a move that has intellectual-property lawyers abuzz：作状语，说明伴随的举动","定语从句 that has intellectual-property lawyers abuzz：修饰 move","宾语从句 that it would use a particular case to conduct a broad review of business-method patents：作 said 的宾语","不定式短语 to conduct a broad review：作目的状语"], collocations: ["Court of Appeals（上诉法院）","intellectual-property lawyers（知识产权律师）","conduct a broad review（进行广泛审查）"] }},
    { num: "⑦", en: "In re Bilski, as the case is known, is “a very big deal”, says Dennis D. Crouch of the University of Missouri School of law. It “has the potential to eliminate an entire class of patents”.", ref: "这个被熟知为比尔斯基案的案件“事关重大”，密苏里大学法学院的丹尼斯·D·克劳奇说，它“有撤销一整类专利的潜力”。",
      ai: { backbone: "引语1：主语 In re Bilski、谓语 is、表语 “a very big deal”；引语2：主语 It、谓语 has、宾语 the potential；主句：谓语 says、主语 Dennis D. Crouch（倒装）", structure: ["名词短语 as the case is known：作插入语，说明案件名称","介词短语 of the University of Missouri School of law：作后置定语，修饰 Dennis D. Crouch","不定式短语 to eliminate an entire class of patents：作后置定语，修饰 the potential"], collocations: ["a very big deal（一件大事）","have the potential to do（有做……的潜力）","eliminate an entire class of（消除一整类的）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "controversialadj.有争议的", word: "controversial", meaning: "adj.有争议的" },
      { raw: "authorizev.批准，认可", word: "authorize", meaning: "v.批准，认可" },
      { raw: "scaleback缩减", word: "scaleback缩减", meaning: "" },
      { raw: "business-methodpatents商业方法专利", word: "business-methodpatents商业方法专利", meaning: "" }
    ],
        split: "Nowthenation’stoppatentcourtappearscompletelyready//toscaleback//on business-methodpatents,//whichhavebeencontroversial//eversincetheywerefirst authorized//10yearsago.",
        grammar: ["主干：主+系+表", "toscalebackonbusiness-methodpatents是todo不定式作状语", "which引导定语从句（限定business-methodpatents）", "eversince引导时间状语从句", "10yearsago在从句中作时间状语"],
        ref: "现在国家最高专利法庭似乎完全准备好缩减商业方法专利的数量，这类专利自十年前首次获批以来就一直备受争议。"
      }
    ]
  },
  {
    day: 91,
    type: "英一",
    source: "2010 Text 2",
    zh: "对商业方法专利申请的限制也许是一次戏剧性的 180 度逆转，因为正是联邦巡回法院自己在1998 年被称为“道富银行案”的裁决中引入了此类专利，批准了一项共同基金资产筹集方法的专利。那项裁决导致了商业方法专利申请卷宗的激增，起初是新兴网络公司试图对特定类型的在线交易占得专有权。后来，更多的老牌公司竞相将此类专利归入其卷宗，哪怕只是作为一项防御性措施以防范可能先发制人的竞争对手。2005 年，IBM 在一份法院案卷中注意到自己被授予了 300 多项商业方法专利，尽管它质疑授予这些专利的法律依据。无独有偶，一些华尔街投资公司也都以金融产品专利来武装自己，即使它们在法庭案例中表示反对这一做法。",
    sentences: [
    { num: "①", en: "Curbs on business-method claims would be a dramatic about-face, because it was the Federal Circuit itself that introduced such patents with its 1998 decision in the so-called State Street Bank case, approving a patent on a way of pooling mutual-fund assets.", ref: "对商业方法专利申请的限制也许是一次戏剧性的 180 度逆转，因为正是联邦巡回法院自己在1998 年被称为“道富银行案”的裁决中引入了此类专利，批准了一项共同基金资产筹集方法的专利。",
      ai: { backbone: "主语 Curbs on business-method claims、谓语 would be、表语 a dramatic about-face；原因状语从句 because it was the Federal Circuit that introduced such patents", structure: ["原因状语从句 because it was the Federal Circuit itself that introduced such patents with its 1998 decision：说明原因","强调句型 it was the Federal Circuit itself that introduced：强调主语","现在分词短语 approving a patent on a way of pooling mutual-fund assets：作伴随状语","介词短语 with its 1998 decision in the so-called State Street Bank case：说明具体决策"], collocations: ["curbs on（对……的限制）","a dramatic about-face（戏剧性的转变）","the Federal Circuit（联邦巡回上诉法院）","pool mutual-fund assets（汇集共同基金资产）"] }},
    { num: "②", en: "That ruling produced an explosion in business-method patent filings, initially by emerging Internet companies trying to stake out exclusive rights to specific types of online transactions.", ref: "那项裁决导致了商业方法专利申请卷宗的激增，起初是新兴网络公司试图对特定类型的在线交易占得专有权。",
      ai: { backbone: "主语 That ruling、谓语 produced、宾语 an explosion", structure: ["介词短语 in business-method patent filings：说明激增的对象","时间状语 initially by emerging Internet companies：说明最初的主体","现在分词短语 trying to stake out exclusive rights to specific types of online transactions：作后置定语，修饰 companies"], collocations: ["produce an explosion in（引发……的激增）","patent filings（专利申请）","emerging Internet companies（新兴互联网公司）","stake out exclusive rights（争夺专有权）","online transactions（在线交易）"] }},
    { num: "③", en: "Later, more established companies raced to add such patents to their files, if only as a defensive move against rivals that might beat them to the punch.", ref: "后来，更多的老牌公司竞相将此类专利归入其卷宗，哪怕只是作为一项防御性措施以防范可能先发制人的竞争对手。",
      ai: { backbone: "主语 more established companies、谓语 raced to add、宾语 such patents", structure: ["时间状语 Later：说明时间","介词短语 to their files：说明添加之处","条件状语 if only as a defensive move：表示“即便只是作为防御之举”","定语从句 that might beat them to the punch：修饰 rivals"], collocations: ["more established companies（更成熟的公司）","race to do（争相做某事）","a defensive move（防御之举）","beat sb. to the punch（先发制人，抢在某人前面）"] }},
    { num: "④", en: "In 2005, IBM noted in a court filing that it had been issued more than 300 business-method patents, despite the fact that it questioned the legal basis for granting them.", ref: "2005 年，IBM 在一份法院案卷中注意到自己被授予了 300 多项商业方法专利，尽管它质疑授予这些专利的法律依据。",
      ai: { backbone: "主句：主语 IBM、谓语 noted、宾语从句 that it had been issued more than 300 business-method patents", structure: ["时间状语 In 2005：说明时间","介词短语 in a court filing：说明场合","宾语从句 that it had been issued more than 300 business-method patents：作 noted 的宾语","让步状语从句 despite the fact that it questioned the legal basis for granting them：表示让步","同位语从句 that it questioned the legal basis：解释说明 the fact"], collocations: ["note in a court filing（在法庭文件中指出）","the legal basis（法律依据）","grant patents（授予专利）"] }},
    { num: "⑤", en: "Similarly, some Wall Street investment firms armed themselves with patents for financial products, even as they took positions in court cases opposing the practice.", ref: "无独有偶，一些华尔街投资公司也都以金融产品专利来武装自己，即使它们在法庭案例中表示反对这一做法。",
      ai: { backbone: "主语 some Wall Street investment firms、谓语 armed themselves、状语 with patents", structure: ["副词 Similarly：作状语，表示“类似地”","介词短语 for financial products：说明专利对应的产品","时间状语从句 even as they took positions in court cases opposing the practice：表示“即便在……时”"], collocations: ["Wall Street investment firms（华尔街投资公司）","arm oneself with（用……武装自己）","financial products（金融产品）","take positions in court cases（在诉讼中采取立场）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "curbn.抑制，控制", word: "curb", meaning: "n.抑制，控制" },
      { raw: "claimn.申请", word: "claim", meaning: "n.申请" },
      { raw: "about-facen.（态度或观点）彻底转变", word: "about-face", meaning: "n.（态度或观点）彻底转变" },
      { raw: "poolv.汇集，集资", word: "pool", meaning: "v.汇集，集资" },
      { raw: "mutualadj.共同的", word: "mutual", meaning: "adj.共同的" },
      { raw: "FederalCircuit联邦巡回法院", word: "FederalCircuit联邦巡回法院", meaning: "" },
      { raw: "StateStreetBank道富银行", word: "StateStreetBank道富银行", meaning: "" }
    ],
        split: "Curbs//onbusiness-methodclaimswouldbeadramaticabout-face,//becauseit wastheFederalCircuititselfthatintroducedsuchpatents//withits1998decision//in theso-calledStateStreetBankcase,//approvingapatent//onaway//ofpooling mutual-fundassets.",
        grammar: ["主干：主+系+表", "because引导原因状语从句", "itwas...that...为强调结构，本句中强调theFederalCircuit", "with...介词短语作方式状语", "approvingapatent...现在分词短语作伴随状语"],
        ref: "对商业方法专利申请的控制是一个突然的180度大转变，因为正是联邦巡回法院在1998年被称为“道富银行案”的决议中引入了这类专利，当时法庭对一种“汇集各种共有基金资产”的方法授予了专利。"
      }
    ]
  },
  {
    day: 92,
    type: "英一",
    source: "2010 Text 2",
    zh: "比尔斯基案涉及一项规避能源市场风险方法的专利申请。联邦巡回法院发布了一项不同寻常的指令，宣称此案将由该法院全体 12 名法官听审，而不是典型的三人组听审，并且宣称法院想要评估一个问题，即，是否需要“重新审议”对道富银行案的裁决。",
    sentences: [
    { num: "①", en: "The Bilski case involves a claimed patent on a method for hedging risk in the energy market.", ref: "比尔斯基案涉及一项规避能源市场风险方法的专利申请。",
      ai: { backbone: "主语 The Bilski case、谓语 involves、宾语 a claimed patent", structure: ["介词短语 on a method for hedging risk in the energy market：作后置定语，修饰 patent","介词短语 for hedging risk：作后置定语，修饰 method","介词短语 in the energy market：说明领域"], collocations: ["involve（涉及）","a claimed patent（一项要求获得授权的专利）","hedge risk（对冲风险）","the energy market（能源市场）"] }},
    { num: "②", en: "The Federal circuit issued an unusual order stating that the case would be heard by all 12 of the court’s judges, rather than a typical panel of three, and that one issue it wants to evaluate is whether it should “reconsider” its State Street Bank ruling.", ref: "联邦巡回法院发布了一项不同寻常的指令，宣称此案将由该法院全体 12 名法官听审，而不是典型的三人组听审，并且宣称法院想要评估一个问题，即，是否需要“重新审议”对道富银行案的裁决。",
      ai: { backbone: "主语 The Federal circuit、谓语 issued、宾语 an unusual order", structure: ["现在分词短语 stating that the case would be heard by all 12 of the court’s judges：作后置定语，修饰 order","宾语从句 that the case would be heard by all 12 of the court’s judges：作 stating 的宾语","介词短语 rather than a typical panel of three：作比较状语","并列宾语从句 and that one issue it wants to evaluate is whether it should “reconsider” its State Street Bank ruling：与前面的 that 从句并列","定语从句 it wants to evaluate：修饰 one issue（省略了关系代词 that）","表语从句 whether it should “reconsider” its State Street Bank ruling：作 is 的表语"], collocations: ["issue an order（发布命令）","a typical panel of three（典型的三人合议庭）","evaluate an issue（评估问题）","reconsider a ruling（重新考虑裁决）"] }}
    ]
  },
  {
    day: 93,
    type: "英一",
    source: "2010 Text 2",
    zh: "联邦巡回法院的（上述）行动紧随最高法院近期一连串缩小专利持有人受保护范围的决议之后。比如，去年 4 月，法官们表示太多的专利授给了平淡无奇的“发明”。联邦巡回法院的法官们正在“对最高法院的反专利趋势作出反应”，身兼专利律师和乔治华盛顿大学法学院教授的哈拉尔德·C·韦格纳说。",
    sentences: [
    { num: "①", en: "The Federal Circuit’s action comes in the wake of a series of recent decisions by the Supreme Court that has narrowed the scope of protections for patent holders.", ref: "联邦巡回法院的（上述）行动紧随最高法院近期一连串缩小专利持有人受保护范围的决议之后。",
      ai: { backbone: "主语 The Federal Circuit’s action、谓语 comes；时间状语 in the wake of a series of recent decisions", structure: ["介词短语 in the wake of（随着，紧随其后）","介词短语 by the Supreme Court：作后置定语，修饰 decisions","定语从句 that has narrowed the scope of protections for patent holders：修饰 decisions"], collocations: ["in the wake of（在……之后）","a series of（一系列）","narrow the scope of（缩小……的范围）","patent holders（专利持有人）"] }},
    { num: "②", en: "Last April, for example, the justices signaled that too many patents were being upheld for “inventions” that are obvious.", ref: "比如，去年 4 月，法官们表示太多的专利授给了平淡无奇的“发明”。",
      ai: { backbone: "主句：主语 the justices、谓语 signaled、宾语从句 that too many patents were being upheld", structure: ["时间状语 Last April：说明时间","插入语 for example：举例说明","宾语从句 that too many patents were being upheld for “inventions” that are obvious：作 signaled 的宾语","定语从句 that are obvious：修饰 “inventions”"], collocations: ["signal that（表明）","uphold patents（支持专利有效）","obvious inventions（显而易见的发明）"] }},
    { num: "③", en: "The judges on the Federal Circuit are “reacting to the anti-patent trend at the Supreme Court”, says Harold C. Wegner, a patent attorney and professor at George Washington University Law School.", ref: "联邦巡回法院的法官们正在“对最高法院的反专利趋势作出反应”，身兼专利律师和乔治华盛顿大学法学院教授的哈拉尔德·C·韦格纳说。",
      ai: { backbone: "引语：主语 The judges on the Federal Circuit、谓语 are “reacting to”、宾语 the anti-patent trend；主句：谓语 says、主语 Harold C. Wegner（倒装）", structure: ["介词短语 at the Supreme Court：作后置定语，修饰 trend","名词短语 a patent attorney and professor at George Washington University Law School：作同位语，说明 Harold C. Wegner 的身份"], collocations: ["react to（对……作出反应）","anti-patent trend（反专利趋势）","patent attorney（专利律师）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "narrowv.使缩小", word: "narrow", meaning: "v.使缩小" },
      { raw: "scopen.范围", word: "scope", meaning: "n.范围" },
      { raw: "inthewakeof随着...而来", word: "inthewakeof随着...而来", meaning: "" }
    ],
        split: "TheFederalCircuit’sactioncomes//inthewakeofaseriesofrecentdecisions //bytheSupremeCourt//thathasnarrowedthescope//ofprotections//forpatent holders.",
        grammar: ["主干：主+谓", "inthewakeof...作状语", "bytheSupremeCourt作后置定语（限定decisions）", "that引导定语从句（限定decisions）注意定语从句的隔离结构", "aseriesof+复数名词作主语时，谓语动词用单数形式"],
        ref: "联邦巡回法院的(上述)行动紧随最高法院近期一连串缩小专利持有人受保护范围的决议之后。"
      }
    ]
  },
  {
    day: 94,
    type: "英一",
    source: "2010 Text 3",
    zh: "马尔科姆·格拉德威尔在其《引爆点》一书中提出，“社会流行潮”在很大程度上由极少数与众不同的个人的行为所推动，这些人通常被称为“有影响力人士”，他们或见识非常广博、或很有说服力，或人脉极广。这一观点虽直觉上令人信服，但未能解释观念实际上如何传播。有影响力人士的所谓重要性源于一个貌似合理、但很大程度上未经证实的被称作“两级流动传播”的理论：信息从媒体流向有影响力人士，再从他们流向其他所有人。营销人员已经欣然接受这种两级流动，因为该理论认为，他们只要能够找到有影响力人士并对其施加影响，这些精挑细选出来的人们就可以为他们完成大部分工作。该理论似乎也解释了某些时式、品牌或地段突然出人意料地大受欢迎的原因。在诸多此类情形中，粗略调查其原因会发现，的确有一小部分人在其他所有人留意之前，就率先穿戴、推广或开发各类东西。这种轶事证据与“只有某些特别的人才能推动潮流”的观点高度契合。",
    sentences: [
    { num: "①", en: "In his book The Tipping Point, Malcolm Gladwell argues that “social epidemics” are driven in large part by the actions of a tiny minority of special individuals, often called influentials, who are unusually informed, persuasive, or well connected.", ref: "马尔科姆·格拉德威尔在其《引爆点》一书中提出，“社会流行潮”在很大程度上由极少数与众不同的个人的行为所推动，这些人通常被称为“有影响力人士”，他们或见识非常广博、或很有说服力，或人脉极广。",
      ai: { backbone: "主句：主语 Malcolm Gladwell、谓语 argues、宾语从句 that “social epidemics” are driven in large part by the actions of a tiny minority", structure: ["介词短语 In his book The Tipping Point：作状语，说明出处","宾语从句 that “social epidemics” are driven in large part by the actions of a tiny minority of special individuals：作 argues 的宾语","过去分词短语 often called influentials：作后置定语，修饰 individuals","非限制性定语从句 who are unusually informed, persuasive, or well connected：修饰 individuals"], collocations: ["in large part（在很大程度上）","a tiny minority（极少数）","social epidemics（社会流行潮）","well connected（人脉广的）"] }},
    { num: "②", en: "The idea is intuitively compelling, but it doesn’t explain how ideas actually spread.", ref: "这一观点虽直觉上令人信服，但未能解释观念实际上如何传播。",
      ai: { backbone: "并列句：句1 主语 The idea、谓语 is compelling；句2 主语 it、谓语 doesn’t explain、宾语从句 how ideas actually spread", structure: ["副词 intuitively：作状语，修饰 compelling","并列连词 but：表转折","宾语从句 how ideas actually spread：作 explain 的宾语"], collocations: ["intuitively compelling（直觉上令人信服）","spread（传播）"] }},
    { num: "③", en: "The supposed importance of influentials derives from a plausible-sounding but largely untested theory called the “two-step flow of communication” : Information flows from the media to the influentials and from them to everyone else.", ref: "有影响力人士的所谓重要性源于一个貌似合理、但很大程度上未经证实的被称作“两级流动传播”的理论：信息从媒体流向有影响力人士，再从他们流向其他所有人。",
      ai: { backbone: "主语 The supposed importance of influentials、谓语 derives from、宾语 a theory", structure: ["形容词短语 plausible-sounding but largely untested：作定语，修饰 theory","过去分词短语 called the “two-step flow of communication” ：作后置定语，修饰 theory","冒号后的句子 Information flows from the media to the influentials and from them to everyone else：解释说明两步传播的含义"], collocations: ["derive from（来源于）","plausible-sounding（听起来合理的）","largely untested（大多未经检验的）","two-step flow of communication（两级传播）"] }},
    { num: "④", en: "Marketers have embraced the two-step flow because it suggests that if they can just find and influence the influentials, those select people will do most of the work for them.", ref: "营销人员已经欣然接受这种两级流动，因为该理论认为，他们只要能够找到有影响力人士并对其施加影响，这些精挑细选出来的人们就可以为他们完成大部分工作。",
      ai: { backbone: "主语 Marketers、谓语 have embraced、宾语 the two-step flow；原因状语从句 because it suggests", structure: ["原因状语从句 because it suggests that if they can just find and influence the influentials, those select people will do most of the work for them：说明原因","宾语从句 that if they can just find and influence the influentials, those select people will do most of the work for them：作 suggests 的宾语","条件状语从句 if they can just find and influence the influentials：嵌入宾语从句中"], collocations: ["embrace（接受，采用）","find and influence（发现并影响）","select people（精选人群）","do most of the work（做大部分工作）"] }},
    { num: "⑤", en: "The theory also seems to explain the sudden and unexpected popularity of certain looks, brands, or neighborhoods.", ref: "该理论似乎也解释了某些时式、品牌或地段突然出人意料地大受欢迎的原因。",
      ai: { backbone: "主语 The theory、谓语 seems to explain、宾语 the popularity", structure: ["介词短语 also：作状语","介词短语 of certain looks, brands, or neighborhoods：作后置定语，修饰 popularity","形容词短语 sudden and unexpected：作定语，修饰 popularity"], collocations: ["sudden and unexpected popularity（突然而意外的流行）","neighborhoods（社区，街区）"] }},
    { num: "⑥", en: "In many such cases, a cursory search for causes finds that some small group of people was wearing, promoting, or developing whatever it is before anyone else paid attention.", ref: "在诸多此类情形中，粗略调查其原因会发现，的确有一小部分人在其他所有人留意之前，就率先穿戴、推广或开发各类东西。",
      ai: { backbone: "主语 a cursory search for causes、谓语 finds、宾语从句 that some small group of people was wearing, promoting, or developing whatever it is", structure: ["介词短语 In many such cases：作状语","宾语从句 that some small group of people was wearing, promoting, or developing whatever it is before anyone else paid attention：作 finds 的宾语","宾语从句 whatever it is：作 developing 的宾语","时间状语从句 before anyone else paid attention：说明时间先后"], collocations: ["a cursory search（粗略的搜寻）","pay attention（注意）","before anyone else（在其他人之前）"] }},
    { num: "⑦", en: "Anecdotal evidence of this kind fits nicely with the idea that only certain special people can drive trends.", ref: "这种轶事证据与“只有某些特别的人才能推动潮流”的观点高度契合。",
      ai: { backbone: "主语 Anecdotal evidence、谓语 fits with、宾语 the idea", structure: ["介词短语 of this kind：作后置定语，修饰 evidence","副词 nicely：作状语，修饰 fits","同位语从句 that only certain special people can drive trends：解释说明 the idea"], collocations: ["anecdotal evidence（轶事性证据）","fit with（与……相符合）","drive trends（引领潮流）"] }}
    ]
  },
  {
    day: 95,
    type: "英一",
    source: "2010 Text 3",
    zh: "然而，一些研究人员在近期研究中得出结论有影响力人士对社会流行潮的影响远比人们通常认为的要小得多。事实上，他们似乎根本不是（社会流行潮）所必需的。研究人员的观点基于对社会影响的一项简单观察：除了像奥普拉·温弗瑞这样的个别名人——她的非凡影响力主要是媒体影响而非人际影响的作用——即使是一个群体中最具影响力的人也根本不会与那么多的人交往。而根据两级流动理论，恰恰是这些非名人有影响力人士通过直接影响他们的朋友和同事，推动了社会流行潮。但是，一种社会流行潮要形成，每个这样受到有影响力人士影响的人都必须接着影响自己的熟人，这些熟人又必须同样地影响他们的熟人，并依次影响下去；这些人中的每个人能得到多少人关注与最初的有影响力人士并无多大关系。例如，假若此“人际影响网络”中与最初有影响力人士仅相隔两个层级的人们表现出（对这种影响的）无动于衷，那么变化的“瀑布流”就不会传播得太远，或者影响很多人。",
    sentences: [
    { num: "①", en: "In their recent work, however, some researchers have come up with the finding that influentials have far less impact on social epidemics than is generally supposed.", ref: "然而，一些研究人员在近期研究中得出结论有影响力人士对社会流行潮的影响远比人们通常认为的要小得多。",
      ai: { backbone: "主句：主语 some researchers、谓语 have come up with、宾语 the finding；时间状语 In their recent work", structure: ["插入语 however：表转折","同位语从句 that influentials have far less impact on social epidemics than is generally supposed：解释说明 the finding","比较状语从句 than is generally supposed：说明比较对象"], collocations: ["come up with（提出，得出）","have impact on（对……有影响）","social epidemics（社会流行潮）","be generally supposed（一般认为）"] }},
    { num: "②", en: "In fact, they don’t seem to be required at all.", ref: "事实上，他们似乎根本不是（社会流行潮）所必需的。",
      ai: { backbone: "主语 they、谓语 don’t seem to be required；状语 at all", structure: ["介词短语 In fact：作状语，表“事实上”","短语 at all：加强否定语气"], collocations: ["in fact（事实上）","not...at all（根本不）","be required（被需要）"] }},
    { num: "③", en: "The researchers’ argument stems from a simple observation about social influence: With the exception of a few celebrities like Oprah Winfrey—whose outsize presence is primarily a function of media, not interpersonal, influence—even the most influential members of a population simply don’t interact with that many others.", ref: "研究人员的观点基于对社会影响的一项简单观察：除了像奥普拉·温弗瑞这样的个别名人——她的非凡影响力主要是媒体影响而非人际影响的作用——即使是一个群体中最具影响力的人也根本不会与那么多的人交往。",
      ai: { backbone: "主语 The researchers’ argument、谓语 stems from、宾语 a simple observation；冒号后为同位语从句", structure: ["介词短语 about social influence：作后置定语，修饰 observation","介词短语 With the exception of a few celebrities like Oprah Winfrey：作状语，表示“除……之外”","非限制性定语从句 whose outsize presence is primarily a function of media, not interpersonal, influence：修饰 Oprah Winfrey","主句 even the most influential members of a population simply don’t interact with that many others：说明观察结果"], collocations: ["stem from（源于）","with the exception of（除……以外）","outsize presence（超凡的影响力）","a function of（……的产物）","interact with（与……互动）"] }},
    { num: "④", en: "Yet it is precisely these non-celebrity influentials who, according to the two-step-flow theory, are supposed to drive social epidemics, by influencing their friends and colleagues directly.", ref: "而根据两级流动理论，恰恰是这些非名人有影响力人士通过直接影响他们的朋友和同事，推动了社会流行潮。",
      ai: { backbone: "强调句型：It is precisely these non-celebrity influentials who are supposed to drive social epidemics", structure: ["强调句型 It is...who...：强调主语","插入语 according to the two-step-flow theory：说明依据","介词短语 by influencing their friends and colleagues directly：作方式状语"], collocations: ["it is...who...（正是……）","non-celebrity influentials（非名人的有影响力者）","be supposed to do（被认为应该做某事）","influence sb. directly（直接影响某人）"] }},
    { num: "⑤", en: "For a social epidemic to occur, however, each person so affected must then influence his or her own acquaintances, who must in turn influence theirs, and so on; and just how many others pay attention to each of these people has little to do with the initial influential.", ref: "但是，一种社会流行潮要形成，每个这样受到有影响力人士影响的人都必须接着影响自己的熟人，这些熟人又必须同样地影响他们的熟人，并依次影响下去；这些人中的每个人能得到多少人关注与最初的有影响力人士并无多大关系。",
      ai: { backbone: "主句：主语 each person、谓语 must influence、宾语 his or her own acquaintances；目的状语 For a social epidemic to occur", structure: ["介词短语 For a social epidemic to occur：作目的状语","程度状语 so affected：作后置定语，修饰 each person","非限制性定语从句 who must in turn influence theirs, and so on：修饰 acquaintances","并列主句 and just how many others pay attention to each of these people has little to do with the initial influential：说明另一观察结果","主语从句 how many others pay attention to each of these people：作并列主句的主语"], collocations: ["for...to occur（为了……发生）","in turn（依次）","have little to do with（与……关系不大）","the initial influential（最初的具有影响力的人）"] }},
    { num: "⑥", en: "If people in the network just two degrees removed from the initial influential prove resistant, for example, the cascade of change won’t propagate very far or affect many people.", ref: "例如，假若此“人际影响网络”中与最初有影响力人士仅相隔两个层级的人们表现出（对这种影响的）无动于衷，那么变化的“瀑布流”就不会传播得太远，或者影响很多人。",
      ai: { backbone: "主句：主语 the cascade of change、谓语 won’t propagate、状语 very far；条件状语从句 If people prove resistant", structure: ["条件状语从句 If people in the network just two degrees removed from the initial influential prove resistant：说明条件","过去分词短语 removed from the initial influential：作后置定语，修饰 people","插入语 for example：举例说明","并列谓语 or affect many people：与 propagate 并列"], collocations: ["prove resistant（证明有抵抗力）","degrees removed from（与……相隔几个层级）","the cascade of change（变化的连锁反应）","propagate（传播）"] }}
    ]
  },
  {
    day: 96,
    type: "英一",
    source: "2010 Text 3",
    zh: "以这个关于人际影响的基本事实为基础，研究人员通过对人群进行无数次的计算机模拟、对与人们影响他人的能力以及被他人影响的倾向相关的若干变量进行操纵分析，研究社会影响的动态。他们发现，所谓的“全球瀑布流”——某种影响经由“社交网络”的广泛传播——形成的首要条件并不是少数几个有影响力人士的存在，而是大量必不可少的易受影响人士的参与。",
    sentences: [
    { num: "①", en: "Building on the basic truth about interpersonal influence, the researchers studied the dynamics of social influence by conducting thousands of computer simulations of populations, manipulating a number of variables relating to people’s ability to influence others and their tendency to be influenced.", ref: "以这个关于人际影响的基本事实为基础，研究人员通过对人群进行无数次的计算机模拟、对与人们影响他人的能力以及被他人影响的倾向相关的若干变量进行操纵分析，研究社会影响的动态。",
      ai: { backbone: "主句：主语 the researchers、谓语 studied、宾语 the dynamics of social influence", structure: ["现在分词短语 Building on the basic truth about interpersonal influence：作方式状语","介词短语 by conducting thousands of computer simulations of populations：作方式状语","现在分词短语 manipulating a number of variables：作伴随状语","现在分词短语 relating to people’s ability to influence others and their tendency to be influenced：作后置定语，修饰 variables"], collocations: ["build on（建立在……之上）","interpersonal influence（人际影响）","the dynamics of（……的动力学/动态）","computer simulations（计算机模拟）","relate to（与……相关）"] }},
    { num: "②", en: "They found that the principal requirement for what is called “global cascades” —the widespread propagation of influence through networks—is the presence not of a few influentials but, rather, of a critical mass of easily influenced people.", ref: "他们发现，所谓的“全球瀑布流”——某种影响经由“社交网络”的广泛传播——形成的首要条件并不是少数几个有影响力人士的存在，而是大量必不可少的易受影响人士的参与。",
      ai: { backbone: "主句：主语 They、谓语 found、宾语从句 that the principal requirement is the presence", structure: ["宾语从句 that the principal requirement for what is called “global cascades” is the presence not of a few influentials but, rather, of a critical mass of easily influenced people：作 found 的宾语","宾语从句 what is called “global cascades” ：作介词 for 的宾语","破折号间的名词短语 the widespread propagation of influence through networks：作 “global cascades” 的同位语","介词短语 not of a few influentials but of a critical mass：用 not...but 结构强调后者"], collocations: ["the principal requirement for（……的主要条件）","global cascades（全球性连锁反应）","widespread propagation（广泛传播）","a critical mass of（足够数量的）","easily influenced people（易受影响的人）"] }}
    ]
  },
  {
    day: 97,
    type: "英一",
    source: "2010 Text 4",
    zh: "在公开场合，银行家们一直把遇到的麻烦归咎于自身。背地里，他们却一直将矛头对准他人：会计准则制定者。各家银行抱怨说，他们所制定的规则迫使自己报告巨额损失，这实在不公平。这些规则称，银行必须根据第三方愿意买入的价格而不是管理者和监管机构期望它们售得的价格来评估部分资产。不幸的是，银行的游说现在似乎开始奏效了。细节或许无从知晓，但是对资本市场正常运作至关重要的准则制定者的独立性正在遭受侵害。而且，除非银行以能够吸引买家的价格出售有毒资产，否则，复苏银行系统将会十分困难。",
    sentences: [
    { num: "①", en: "Bankers have been blaming themselves for their troubles in public.", ref: "在公开场合，银行家们一直把遇到的麻烦归咎于自身。",
      ai: { backbone: "主语 Bankers、谓语 have been blaming themselves、宾语 for their troubles", structure: ["介词短语 for their troubles：说明自责的原因","介词短语 in public：作状语，表示“公开地”"], collocations: ["blame oneself for（因……自责）","in public（公开地）"] }},
    { num: "②", en: "Behind the scenes, they have been taking aim at someone else the accounting standard-setters.", ref: "背地里，他们却一直将矛头对准他人：会计准则制定者。",
      ai: { backbone: "主语 they、谓语 have been taking aim at、宾语 someone else", structure: ["介词短语 Behind the scenes：作状语，表示“在幕后”","破折号后的 the accounting standard-setters：作 someone else 的同位语，具体说明目标","介词短语 at someone else：与 take aim 搭配"], collocations: ["behind the scenes（在幕后）","take aim at（瞄准，针对）","accounting standard-setters（会计准则制定者）"] }},
    { num: "③", en: "Their rules, moan the banks, have forced them to report enormous losses, and it’s just not fair.", ref: "各家银行抱怨说，他们所制定的规则迫使自己报告巨额损失，这实在不公平。",
      ai: { backbone: "主句：主语 They（指 rules）、谓语 have forced、宾语 them、宾补 to report enormous losses", structure: ["插入语 moan the banks：作插入成分，说明抱怨的主体","并列句 and it’s just not fair：说明抱怨的理由","副词 just：加强语气"], collocations: ["moan（抱怨）","force sb. to do（迫使某人做某事）","enormous losses（巨大的损失）"] }},
    { num: "④", en: "These rules say they must value some assets at the price a third party would pay, not the price managers and regulators would like them to fetch.", ref: "这些规则称，银行必须根据第三方愿意买入的价格而不是管理者和监管机构期望它们售得的价格来评估部分资产。",
      ai: { backbone: "主语 These rules、谓语 say、宾语从句 they must value some assets at the price", structure: ["宾语从句 they must value some assets at the price a third party would pay：作 say 的宾语","定语从句 a third party would pay：修饰 the price（省略了关系代词 that）","介词短语 not the price managers and regulators would like them to fetch：与前面的 price 并列对照","定语从句 managers and regulators would like them to fetch：修饰 price（省略了关系代词 that）"], collocations: ["value assets（给资产估值）","a third party（第三方）","fetch a price（卖得……的价格）"] }},
    { num: "⑤", en: "Unfortunately, banks’ lobbying now seems to be working.", ref: "不幸的是，银行的游说现在似乎开始奏效了。",
      ai: { backbone: "主语 banks’ lobbying、谓语 seems to be working；状语 now", structure: ["副词 Unfortunately：作评注性状语","现在进行时 to be working：表示正在发挥作用"], collocations: ["lobbying（游说）","seem to be working（似乎在起作用）"] }},
    { num: "⑥", en: "The details may be unknowable, but the independence of standard-setters, essential to the proper functioning of capital markets, is being compromised.", ref: "细节或许无从知晓，但是对资本市场正常运作至关重要的准则制定者的独立性正在遭受侵害。",
      ai: { backbone: "并列句：句1 主语 The details、谓语 may be unknowable；句2 主语 the independence、谓语 is being compromised", structure: ["转折连词 but：表转折","插入语 essential to the proper functioning of capital markets：作后置定语，修饰 the independence","介词短语 of standard-setters：作后置定语，修饰 the independence","介词短语 to the proper functioning of capital markets：与 essential 搭配"], collocations: ["be unknowable（无法得知）","be essential to（对……至关重要）","proper functioning（正常运转）","capital markets（资本市场）","be compromised（被削弱，受到损害）"] }},
    { num: "⑦", en: "And, unless banks carry toxic assets at prices that attract buyers, reviving the banking system will be difficult.", ref: "而且，除非银行以能够吸引买家的价格出售有毒资产，否则，复苏银行系统将会十分困难。",
      ai: { backbone: "主句：动名词短语 reviving the banking system、谓语 will be difficult；条件状语从句 unless banks carry toxic assets", structure: ["条件状语从句 unless banks carry toxic assets at prices that attract buyers：说明条件","定语从句 that attract buyers：修饰 prices","介词短语 at prices：说明以何种价格"], collocations: ["unless（除非）","toxic assets（有毒资产）","attract buyers（吸引买家）","revive the banking system（重振银行体系）"] }}
    ],
    analysis: [
      {
        sentNum: "⑥",
        vocab: [
      { raw: "independencen.独立", word: "independence", meaning: "n.独立" },
      { raw: "essentialadj.非常重要的", word: "essential", meaning: "adj.非常重要的" },
      { raw: "functionv.运转", word: "function", meaning: "v.运转" },
      { raw: "compromisev.危及，损害", word: "compromise", meaning: "v.危及，损害" }
    ],
        split: "Thedetailsmaybeunknowable,//buttheindependence//ofstandard-setters, //essentialtotheproperfunctioning//ofcapitalmarkets,//isbeingcompromised.",
        grammar: ["主干：主+系+表but主+谓（并列句）", "essentialto...作后置定语（限定independenceofstandard-setters）", "isbeingcompromised作第二个分句的谓语compromisev.危及，损害"],
        ref: "细节或许无从知晓，但是对资本市场正常运作至关重要的准则制定者的独立性正在遭受侵害。"
      }
    ]
  },
  {
    day: 98,
    type: "英一",
    source: "2010 Text 4",
    zh: "在与国会的一场激烈交锋之后，美国财务会计准则委员会（FASB）匆匆修改了准则。这些修改赋予银行在使用模型评估非流动资产时更多自由、在认定损益表上长期资产损失时更多灵活性。FASB 主席鲍伯·赫茨强烈反对那些“质疑我们动机”的人。然而，银行股票上涨了，而且这些修改增强了某游说团体客气谓之的“管理层判断力的运用”。欧洲各国部长立刻强烈要求国际会计标准理事会（IASB）采取同样的做法。IASB 表示不愿意在没有总体规划的情况下就贸然行动，但当其今年晚些时候完成准则重建时，将会面临巨大的屈服压力。欧盟委员会成员查理·迈克里维警告 IASB 说，它“并非生活在政治真空中”，而是“处在现实世界”，而且欧洲迟早会制定不同的规则。",
    sentences: [
    { num: "①", en: "After a bruising encounter with Congress, America’s Financial Accounting Standards Board (FASB) rushed through rule changes.", ref: "在与国会的一场激烈交锋之后，美国财务会计准则委员会（FASB）匆匆修改了准则。",
      ai: { backbone: "主语 America’s Financial Accounting Standards Board (FASB)、谓语 rushed through、宾语 rule changes", structure: ["介词短语 After a bruising encounter with Congress：作时间状语","介词短语 with Congress：说明交锋对象"], collocations: ["a bruising encounter（激烈的交锋）","rush through（仓促通过）","rule changes（规则变更）"] }},
    { num: "②", en: "These gave banks more freedom to use models to value illiquid assets and more flexibility in recognizing losses on long-term assets in their income statements.", ref: "这些修改赋予银行在使用模型评估非流动资产时更多自由、在认定损益表上长期资产损失时更多灵活性。",
      ai: { backbone: "主语 These、谓语 gave、宾语 banks、宾补 more freedom and more flexibility（并列）", structure: ["不定式短语 to use models to value illiquid assets：作后置定语，修饰 more freedom","介词短语 in recognizing losses on long-term assets in their income statements：作后置定语，修饰 more flexibility","介词短语 on long-term assets：说明损失的资产类型","介词短语 in their income statements：说明位置"], collocations: ["give sb. freedom to do（给某人做某事的自由）","value illiquid assets（为流动性差的资产估值）","recognize losses（确认损失）","long-term assets（长期资产）","income statements（利润表）"] }},
    { num: "③", en: "Bob Herz, the FASB’s chairman, cried out against those who question our motives.", ref: "FASB 主席鲍伯·赫茨强烈反对那些“质疑我们动机”的人。",
      ai: { backbone: "主语 Bob Herz、谓语 cried out against、宾语 those", structure: ["名词短语 the FASB’s chairman：作同位语，说明 Bob Herz 的身份","定语从句 who question our motives：修饰 those"], collocations: ["cry out against（大声抗议）","question one’s motives（质疑某人的动机）"] }},
    { num: "④", en: "Yet bank shares rose and the changes enhance what one lobby group politely calls the use of judgment by management.", ref: "然而，银行股票上涨了，而且这些修改增强了某游说团体客气谓之的“管理层判断力的运用”。",
      ai: { backbone: "并列句：句1 主语 bank shares、谓语 rose；句2 主语 the changes、谓语 enhance、宾语 what one lobby group politely calls the use of judgment by management", structure: ["转折连词 Yet：表转折","宾语从句 what one lobby group politely calls the use of judgment by management：作 enhance 的宾语，其中 what 作 calls 的宾语"], collocations: ["bank shares（银行股）","enhance（增强，提升）","the use of judgment（运用判断力）","lobby group（游说团体）"] }},
    { num: "⑤", en: "European ministers instantly demanded that the International Accounting Standards Board (IASB) do likewise.", ref: "欧洲各国部长立刻强烈要求国际会计标准理事会（IASB）采取同样的做法。",
      ai: { backbone: "主语 European ministers、谓语 demanded、宾语从句 that the IASB do likewise", structure: ["副词 instantly：作状语，表示“立即”","宾语从句 that the International Accounting Standards Board (IASB) do likewise：作 demanded 的宾语（虚拟语气，省略 should）"], collocations: ["demand that...do（要求……做某事，虚拟语气）","do likewise（照样做）"] }},
    { num: "⑥", en: "The IASB says it does not want to act without overall planning, but the pressure to fold when it completes its reconstruction of rules later this year is strong.", ref: "IASB 表示不愿意在没有总体规划的情况下就贸然行动，但当其今年晚些时候完成准则重建时，将会面临巨大的屈服压力。",
      ai: { backbone: "主句：主语 The IASB、谓语 says、宾语从句 it does not want to act；并列句 but the pressure is strong", structure: ["宾语从句 it does not want to act without overall planning：作 says 的宾语","转折连词 but：表转折","介词短语 without overall planning：说明前提","不定式短语 to fold when it completes its reconstruction of rules later this year：作后置定语，修饰 the pressure","时间状语从句 when it completes its reconstruction of rules later this year：说明屈服的时间"], collocations: ["act without overall planning（不经全面规划就行动）","the pressure to do（做某事的压力）","fold（屈服，妥协）","the reconstruction of rules（规则的重新制定）"] }},
    { num: "⑦", en: "Charlie McCreevy, a European commissioner, warned the IASB that it did not live in a political vacuum but in the real world and the Europe could yet develop different rules.", ref: "欧盟委员会成员查理·迈克里维警告 IASB 说，它“并非生活在政治真空中”，而是“处在现实世界”，而且欧洲迟早会制定不同的规则。",
      ai: { backbone: "主语 Charlie McCreevy、谓语 warned、宾语 the IASB、宾语从句 that it did not live in a political vacuum but in the real world", structure: ["名词短语 a European commissioner：作同位语，说明 Charlie McCreevy 的身份","宾语从句 that it did not live in a political vacuum but in the real world：作 warned 的宾语","not...but 结构：强调“不是……而是……”","并列分句 and the Europe could yet develop different rules：补充说明"], collocations: ["warn sb. that（警告某人……）","a political vacuum（政治真空）","the real world（现实世界）","develop different rules（制定不同的规则）"] }}
    ],
    analysis: [
      {
        sentNum: "⑥",
        vocab: [
      { raw: "overalladj.总体上的，全面的", word: "overall", meaning: "adj.总体上的，全面的" },
      { raw: "foldv.屈服，认输", word: "fold", meaning: "v.屈服，认输" },
      { raw: "reconstructionn.重建", word: "reconstruction", meaning: "n.重建" }
    ],
        split: "TheIASBsays//(that)itdoesnotwanttoact//withoutoverallplanning,//butthe pressure//tofold//whenitcompletesitsreconstructionofrules//laterthisyearis strong.",
        grammar: ["主干：主+谓+宾语从句but主+系+表（并列句）", "withoutoverallplanning在宾语从句中作条件状语", "tofold作后置定语（限定pressure）", "when引导时间状语从句"],
        ref: "IASB表示不愿意在没有总体规划的情况下就贸然行动，但当其今年晚些时候完成准则重建时，将会面临巨大的屈服压力。"
      }
    ]
  },
  {
    day: 99,
    type: "英一",
    source: "2010 Text 4",
    zh: "是银行的想法不切实际，它们的账目严重高估了资产。如今，银行辩称，市场价格夸大了损失，因为这些价格大多反映的是市场暂时的流动性不足，而不是坏账可能达到的分量。真相在多年后方可得知。但是，银行股票的交易价格低于其账面价值，这表明投资者持怀疑态度。另外，市场的萧条也在一定程度上反映出银行的瘫痪。银行因害怕将损失计入账目而不愿出售资产，而同时又不愿收购那些所谓的廉价资产。",
    sentences: [
    { num: "①", en: "It was banks that were on the wrong planet, with accounts that vastly overvalued assets.", ref: "是银行的想法不切实际，它们的账目严重高估了资产。",
      ai: { backbone: "强调句型：It was banks that were on the wrong planet", structure: ["强调句型 It was...that...：强调主语 banks","介词短语 with accounts that vastly overvalued assets：作伴随状语","定语从句 that vastly overvalued assets：修饰 accounts"], collocations: ["it was...that...（正是……）","be on the wrong planet（脱离实际，不切实际）","overvalue assets（高估资产）"] }},
    { num: "②", en: "Today they argue that market prices overstate losses, because they largely reflect the temporary illiquidity of markets, not the likely extent of bad debts.", ref: "如今，银行辩称，市场价格夸大了损失，因为这些价格大多反映的是市场暂时的流动性不足，而不是坏账可能达到的分量。",
      ai: { backbone: "主语 they、谓语 argue、宾语从句 that market prices overstate losses；原因状语从句 because they largely reflect the temporary illiquidity", structure: ["时间状语 Today：作状语","宾语从句 that market prices overstate losses：作 argue 的宾语","原因状语从句 because they largely reflect the temporary illiquidity of markets, not the likely extent of bad debts：说明原因","not...结构：说明反映的不是什么"], collocations: ["argue that（主张）","overstate losses（夸大损失）","temporary illiquidity（暂时的流动性不足）","the extent of bad debts（坏账的规模）"] }},
    { num: "③", en: "The truth will not be known for years.", ref: "真相在多年后方可得知。",
      ai: { backbone: "主语 The truth、谓语 will not be known；时间状语 for years", structure: ["介词短语 for years：作时间状语"], collocations: ["the truth（真相）","for years（多年来）"] }},
    { num: "④", en: "But banks’ shares trade below their book value, suggesting that investors are skeptical.", ref: "但是，银行股票的交易价格低于其账面价值，这表明投资者持怀疑态度。",
      ai: { backbone: "主句：主语 banks’ shares、谓语 trade、状语 below their book value；结果状语从句 suggesting that investors are skeptical", structure: ["转折连词 But：表转折","现在分词短语 suggesting that investors are skeptical：作伴随/结果状语","宾语从句 that investors are skeptical：作 suggesting 的宾语"], collocations: ["book value（账面价值）","trade below（以低于……的价格交易）","be skeptical（持怀疑态度）"] }},
    { num: "⑤", en: "And dead markets partly reflect the paralysis of banks which will not sell assets for fear of booking losses, yet are reluctant to buy all those supposed bargains.", ref: "另外，市场的萧条也在一定程度上反映出银行的瘫痪。银行因害怕将损失计入账目而不愿出售资产，而同时又不愿收购那些所谓的廉价资产。",
      ai: { backbone: "主语 dead markets、谓语 reflect、宾语 the paralysis of banks", structure: ["副词 partly：作状语，表示“部分地”","定语从句 which will not sell assets for fear of booking losses：修饰 banks","介词短语 for fear of booking losses：说明不卖的原因","并列谓语 yet are reluctant to buy all those supposed bargains：与 will not sell 并列"], collocations: ["dead markets（死气沉沉的市场）","for fear of（唯恐）","book losses（确认亏损）","be reluctant to do（不愿做某事）","supposed bargains（所谓的便宜货）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "overvaluev.估价过高", word: "overvalue", meaning: "v.估价过高" },
      { raw: "onthewrongplanet脱离实际，与周围格格不入", word: "onthewrongplanet脱离实际，与周围格格不入", meaning: "" },
      { raw: "accountn.账户", word: "account", meaning: "n.账户" }
    ],
        split: "Itwasbanksthatwereonthewrongplanet,//withaccounts//thatvastly overvaluedassets.",
        grammar: ["主干：主+系+表", "Itwas...that...为强调结构", "withaccountsthat...为介词短语作原因状语（注意本句因果关系）", "that引导定语从句"],
        ref: "是银行的想法不切实际，(因为)它们的账目严重高估了资产。"
      }
    ]
  },
  {
    day: 100,
    type: "英一",
    source: "2010 Text 4",
    zh: "要想使银行体系重新运转，必须承认损失并对其做出处理。除非银行将有毒资产价格确定在买家觉得有吸引力的水平上，否则美国全面收购有毒资产的新计划就不会起作用。健康的市场需要独立甚至好战的准则制定者。FASB 和 IASB 过去一直正是如此，例如，（他们）不顾特殊利益集团的强烈反对，对有关股票期权和养老基金方面的（会计）准则进行了整顿。但是他们现在对批评者妥协，将由此招致做出更多让步的压力。",
    sentences: [
    { num: "①", en: "To get the system working again, losses must be recognized and dealt with.", ref: "要想使银行体系重新运转，必须承认损失并对其做出处理。",
      ai: { backbone: "目的状语从句：To get the system working again；主句：主语 losses、谓语 must be recognized and dealt with", structure: ["不定式短语 To get the system working again：作目的状语","过去分词短语 working again：作宾语补足语，说明使系统恢复运转","并列谓语 must be recognized and dealt with"], collocations: ["get...working again（使……重新运转）","recognize losses（确认损失）","deal with（处理）"] }},
    { num: "②", en: "America’s new plan to buy up toxic assets will not work unless banks mark assets to levels which buyers find attractive.", ref: "除非银行将有毒资产价格确定在买家觉得有吸引力的水平上，否则美国全面收购有毒资产的新计划就不会起作用。",
      ai: { backbone: "主句：主语 America’s new plan、谓语 will not work；条件状语从句 unless banks mark assets to levels", structure: ["不定式短语 to buy up toxic assets：作后置定语，修饰 plan","条件状语从句 unless banks mark assets to levels which buyers find attractive：说明条件","定语从句 which buyers find attractive：修饰 levels"], collocations: ["buy up（大量买进）","toxic assets（有毒资产）","mark assets to（将资产按……计价）","find attractive（认为有吸引力）"] }},
    { num: "③", en: "Successful markets require independent and even combative standard-setters.", ref: "健康的市场需要独立甚至好战的准则制定者。",
      ai: { backbone: "主语 Successful markets、谓语 require、宾语 independent and even combative standard-setters", structure: ["并列定语 independent and even combative：修饰 standard-setters"], collocations: ["successful markets（成功的市场）","combative standard-setters（有战斗精神的准则制定者）"] }},
    { num: "④", en: "The FASB and IASB have been exactly that, cleaning up rules on stock options and pensions, for example, against hostility from special interests.", ref: "FASB 和 IASB 过去一直正是如此，例如，（他们）不顾特殊利益集团的强烈反对，对有关股票期权和养老基金方面的（会计）准则进行了整顿。",
      ai: { backbone: "主语 The FASB and IASB、谓语 have been、表语 exactly that", structure: ["现在分词短语 cleaning up rules on stock options and pensions：作伴随状语","介词短语 for example：举例说明","介词短语 against hostility from special interests：说明面对的阻力"], collocations: ["clean up rules（清理规则）","stock options（股票期权）","against hostility（面对敌意）","special interests（特殊利益集团）"] }},
    { num: "⑤", en: "But by giving in to critics now they are inviting pressure to make more concessions.", ref: "但是他们现在对批评者妥协，将由此招致做出更多让步的压力。",
      ai: { backbone: "主句：主语 they、谓语 are inviting、宾语 pressure；条件/方式状语 by giving in to critics now", structure: ["介词短语 by giving in to critics now：作方式状语","不定式短语 to make more concessions：作后置定语，修饰 pressure"], collocations: ["give in to（向……让步）","invite pressure（招致压力）","make concessions（作出让步）"] }}
    ]
  },
  {
    day: 101,
    type: "英二",
    source: "2010 Text 1",
    zh: "2008 年 9 月 15 日伦敦苏富比拍卖行举办的“在我脑海，美丽永恒”主题拍卖会上，随着达米恩·赫斯特的 56 件作品被售出，一个世纪以来艺术品市场最长的牛市也戏剧性地落幕了，除两件作品以外，其余作品全部售出，拍卖总额超过七千万英镑，创造了单个艺术家作品拍卖的最高记录。这是一场最后的胜利。拍卖师喊出报价的同时，纽约华尔街上历史最悠久的银行之一雷曼兄弟也申请了破产。世界艺术品市场在经历了自 2003 年以来的急剧增长后，相当长一段时间以来都失去了其原有的发展势头。据艺术经济学研究公司的创始人克莱尔·麦克安德鲁估算，在 2007 年的顶峰时期，艺术品市场价值约为 650 亿美元，是五年前的两倍。从那以后，该价值可能已降至500 亿美元。但这一市场产生的利益远远超出它本身的规模，因为它将巨额财富、自负、贪婪、激情和争议以一种其他行业无法比拟的方式汇集在了一起。",
    sentences: [
    { num: "①", en: "The longest bull run in a century of art-market history ended on a dramatic note with a sale of 56 works by Damien Hirst, Beautiful Inside My Head Forever, at Sotheby’s in London on September 15th, 2008. All but two pieces sold, fetching more than £ 70m, a record for a sale by a single artist.", ref: "2008 年 9 月 15 日伦敦苏富比拍卖行举办的“在我脑海，美丽永恒”主题拍卖会上，随着达米恩·赫斯特的 56 件作品被售出，一个世纪以来艺术品市场最长的牛市也戏剧性地落幕了，除两件作品以外，其余作品全部售出，拍卖总额超过七千万英镑，创造了单个艺术家作品拍卖的最高记录。",
      ai: { backbone: "主语 The longest bull run、谓语 ended、状语 on a dramatic note；时间状语 in a century of art-market history", structure: ["介词短语 in a century of art-market history：说明历史跨度","介词短语 with a sale of 56 works by Damien Hirst, Beautiful Inside My Head Forever, at Sotheby’s in London on September 15th, 2008：作方式状语，说明以何种方式结束","名词短语 Beautiful Inside My Head Forever：作 sale 的同位语，说明拍卖会名称","分号后的句子 All but two pieces sold, fetching more than £70m, a record for a sale by a single artist：补充说明拍卖结果","现在分词短语 fetching more than £70m：作伴随状语"], collocations: ["the longest bull run（最长的牛市）","art-market history（艺术品市场历史）","end on a dramatic note（以戏剧性的方式结束）","a record for（……的纪录）"] }},
    { num: "②", en: "It was a last victory.", ref: "这是一场最后的胜利。",
      ai: { backbone: "主语 It、谓语 was、表语 a last victory", structure: ["代词 It 指代前文所述拍卖","形容词 last：作定语，修饰 victory"], collocations: ["a last victory（最后的胜利）"] }},
    { num: "③", en: "As the auctioneer called out bids, in New York one of the oldest banks on Wall Street, Lehman Brothers, filed for bankruptcy.", ref: "拍卖师喊出报价的同时，纽约华尔街上历史最悠久的银行之一雷曼兄弟也申请了破产。",
      ai: { backbone: "主句：主语 one of the oldest banks on Wall Street, Lehman Brothers、谓语 filed for bankruptcy；时间状语从句 As the auctioneer called out bids", structure: ["时间状语从句 As the auctioneer called out bids：表示“当……时”","地点状语 in New York：说明地点","名词短语 Lehman Brothers：作 one of the oldest banks 的同位语"], collocations: ["call out bids（报出竞价）","file for bankruptcy（申请破产）","Lehman Brothers（雷曼兄弟）"] }},
    { num: "④", en: "The world art market had already been losing momentum for a while after rising bewilderingly since 2003.", ref: "世界艺术品市场在经历了自 2003 年以来的急剧增长后，相当长一段时间以来都失去了其原有的发展势头。",
      ai: { backbone: "主语 The world art market、谓语 had been losing momentum；时间状语 for a while", structure: ["介词短语 after rising bewilderingly since 2003：作时间状语，说明此前的情况","现在分词短语 rising bewilderingly：作介词 after 的宾语"], collocations: ["lose momentum（失去势头）","for a while（一段时间）","rise bewilderingly（疯狂上涨）"] }},
    { num: "⑤", en: "At its peak in 2007 it was worth some $ 65 billion, reckons Clare McAndrew, founder of Arts Economics, a research firm—double the figure five years earlier.", ref: "据艺术经济学研究公司的创始人克莱尔·麦克安德鲁估算，在 2007 年的顶峰时期，艺术品市场价值约为 650 亿美元，是五年前的两倍。",
      ai: { backbone: "主语 it、谓语 was worth、宾语 some $65 billion；时间状语 At its peak in 2007", structure: ["插入语 reckons Clare McAndrew：说明信息来源","名词短语 founder of Arts Economics, a research firm：作同位语，说明 Clare McAndrew 的身份","破折号后的 double the figure five years earlier：作补充说明，与前文形成对比"], collocations: ["at its peak（处于顶峰时）","be worth（价值）","a research firm（研究公司）","double the figure（两倍于……的数字）"] }},
    { num: "⑥", en: "Since then it may have come down to $50 billion.", ref: "从那以后，该价值可能已降至500 亿美元。",
      ai: { backbone: "主语 it、谓语 may have come down；介词短语 to $50 billion", structure: ["时间状语 Since then：说明自那以后","完成时 may have come down：表示可能已经下降"], collocations: ["since then（自那以后）","come down to（降至）"] }},
    { num: "⑦", en: "But the market generates interest far beyond its size because it brings together great wealth, enormous egos, greed, passion and controversy in a way matched by few other industries.", ref: "但这一市场产生的利益远远超出它本身的规模，因为它将巨额财富、自负、贪婪、激情和争议以一种其他行业无法比拟的方式汇集在了一起。",
      ai: { backbone: "主句：主语 the market、谓语 generates、宾语 interest；让步状语从句 far beyond its size", structure: ["原因状语从句 because it brings together great wealth, enormous egos, greed, passion and controversy：说明原因","介词短语 in a way matched by few other industries：作方式状语","过去分词短语 matched by few other industries：作后置定语，修饰 way"], collocations: ["generate interest（引发兴趣）","bring together（把……聚集在一起）","enormous egos（巨大的自负）","in a way matched by（以……所不能及的方式）"] }}
    ]
  },
  {
    day: 102,
    type: "英二",
    source: "2010 Text 1",
    zh: "赫斯特作品拍卖之后的一段时间内，任何种类的消费都变得极其不合时宜。在艺术品领域，这意味着收藏家远离了画廊和拍卖场。2008 年当年截至 11 月，当代艺术品的销售额下降了2/3，而在其最热门的领域则下降了近 90%。几周之内，全球最大的两家拍卖行，苏富比和佳士得，不得不向那些将艺术品交由它们售卖的客户支付将近 2 亿美元的保证金。",
    sentences: [
    { num: "①", en: "In the weeks and months that followed Mr. Hirst’s sale, spending of any sort became deeply unfashionable.", ref: "赫斯特作品拍卖之后的一段时间内，任何种类的消费都变得极其不合时宜。",
      ai: { backbone: "主语 spending of any sort、谓语 became、表语 deeply unfashionable", structure: ["介词短语 In the weeks and months that followed Mr. Hirst’s sale：作时间状语","定语从句 that followed Mr. Hirst’s sale：修饰 weeks and months","介词短语 of any sort：作后置定语，修饰 spending"], collocations: ["spending of any sort（任何形式的消费）","become deeply unfashionable（变得非常不合时宜）"] }},
    { num: "②", en: "In the art world that meant collectors stayed away from galleries and salerooms.", ref: "在艺术品领域，这意味着收藏家远离了画廊和拍卖场。",
      ai: { backbone: "主句：主语 collectors、谓语 stayed away、状语 from galleries and salerooms；宾语从句 that meant", structure: ["介词短语 In the art world：作状语，说明领域","宾语从句 that meant collectors stayed away：作 meant 的宾语","从句中主语 collectors、谓语 stayed away"], collocations: ["in the art world（在艺术界）","stay away from（远离）","galleries and salerooms（画廊和拍卖厅）"] }},
    { num: "③", en: "Sales of contemporary art fell by two-thirds, and in the most overheated sector, they were down by nearly 90% in the year to November 2008.", ref: "2008 年当年截至 11 月，当代艺术品的销售额下降了2/3，而在其最热门的领域则下降了近 90%。",
      ai: { backbone: "并列句：句1 主语 Sales of contemporary art、谓语 fell、状语 by two-thirds；句2 主语 they、谓语 were down、状语 by nearly 90%", structure: ["介词短语 of contemporary art：作后置定语，修饰 Sales","时间状语 in the year to November 2008：说明时间范围","介词短语 in the most overheated sector：说明最过热的领域"], collocations: ["contemporary art（当代艺术）","fall by two-thirds（下降三分之二）","the most overheated sector（最过热的领域）","be down by（下降……）"] }},
    { num: "④", en: "Within weeks the world’s two biggest auction houses, Sotheby’s and Christie’s, had to pay out nearly $200m in guarantees to clients who had placed works for sale with them.", ref: "几周之内，全球最大的两家拍卖行，苏富比和佳士得，不得不向那些将艺术品交由它们售卖的客户支付将近 2 亿美元的保证金。",
      ai: { backbone: "主句：主语 the world’s two biggest auction houses、谓语 had to pay out、宾语 nearly $200m", structure: ["时间状语 Within weeks：说明时间","名词短语 Sotheby’s and Christie’s：作 the world’s two biggest auction houses 的同位语","介词短语 in guarantees：说明支付的性质","定语从句 who had placed works for sale with them：修饰 clients"], collocations: ["auction houses（拍卖行）","pay out（支付）","in guarantees（作为担保金）","place works for sale（提供作品出售）"] }}
    ]
  },
  {
    day: 103,
    type: "英二",
    source: "2010 Text 1",
    zh: "当前艺术品市场的下滑是自 1989 年底日本停止购买印象派作品以来最糟糕的一次。专家估计这次下滑使艺术品价值较之其峰值平均下跌了约 40%，不过有些艺术品价格的波动幅度更大。但是佳士得的首席执行官 Edward Dolman 说:“我非常肯定我们现在已处于谷底。他说，此次衰退不同于上次的地方在于现在市场上仍然有买家。几乎所有接受此次特别报道的受访者都说，当前最大的问题不是缺少需求，而是缺少好的售卖作品。3D——死亡、债务和离婚——依然是将艺术品推向市场的三大因素。但那些不是非卖不可的人都在远离市场，等待市场信心的回转。",
    sentences: [
    { num: "①", en: "The current downturn in the art market is the worst since the Japanese stopped buying Impressionists at the end of 1989.", ref: "当前艺术品市场的下滑是自 1989 年底日本停止购买印象派作品以来最糟糕的一次。",
      ai: { backbone: "主语 The current downturn in the art market、谓语 is、表语 the worst", structure: ["介词短语 in the art market：作后置定语，修饰 downturn","介词短语 since the Japanese stopped buying Impressionists at the end of 1989：作时间状语，表示自……以来","动名词短语 buying Impressionists：作 stopped 的宾语","介词短语 at the end of 1989：说明时间"], collocations: ["the current downturn（当前的低迷）","the worst since（自……以来最严重的）","Impressionists（印象派作品）","at the end of（在……结束时）"] }},
    { num: "②", en: "This time experts reckon that prices are about 40% down on their peak on average, though some have been far more fluctuant.", ref: "专家估计这次下滑使艺术品价值较之其峰值平均下跌了约 40%，不过有些艺术品价格的波动幅度更大。",
      ai: { backbone: "主句：主语 experts、谓语 reckon、宾语从句 that prices are about 40% down on their peak", structure: ["时间状语 This time：说明时间","宾语从句 that prices are about 40% down on their peak on average：作 reckon 的宾语","让步状语从句 though some have been far more fluctuant：表示让步"], collocations: ["reckon that（估计）","down on their peak（比顶峰时低）","on average（平均而言）","far more fluctuant（波动大得多）"] }},
    { num: "③", en: "But Edward Dolman, Christie’s chief executive, says: “I’m pretty confident we’re at the bottom.”", ref: "但是佳士得的首席执行官 Edward Dolman 说:“我非常肯定我们现在已处于谷底。",
      ai: { backbone: "引语：主语 I、谓语 am、表语 confident、宾语从句 we’re at the bottom；主句：谓语 says、主语 Edward Dolman（倒装）", structure: ["名词短语 Christie’s chief executive：作同位语，说明 Edward Dolman 的身份","宾语从句 we’re at the bottom：作 confident 的宾语","副词 pretty：加强语气"], collocations: ["chief executive（首席执行官）","be confident（有信心）","be at the bottom（处于底部）"] }},
    { num: "④", en: "What makes this slump different from the last, he says, is that there are still buyers in the market.", ref: "他说，此次衰退不同于上次的地方在于现在市场上仍然有买家。",
      ai: { backbone: "主句：主语 What、谓语 makes、宾语 this slump、宾补 different；比较状语 from the last", structure: ["主语从句 What makes this slump different from the last：作主句主语","插入语 he says：说明信息来源","宾语从句 that there are still buyers in the market：作 says 的宾语"], collocations: ["make...different（使……不同）","this slump（本次低迷）","buyers in the market（市场中的买家）"] }},
    { num: "⑤", en: "Almost everyone who was interviewed for this special report said that the biggest problem at the moment is not a lack of demand but a lack of good work to sell.", ref: "几乎所有接受此次特别报道的受访者都说，当前最大的问题不是缺少需求，而是缺少好的售卖作品。",
      ai: { backbone: "主语 Almost everyone、谓语 said、宾语从句 that the biggest problem is not a lack of demand but a lack of good work", structure: ["定语从句 who was interviewed for this special report：修饰 everyone","宾语从句 that the biggest problem at the moment is not a lack of demand but a lack of good work to sell：作 said 的宾语","not...but...结构：强调后者","不定式短语 to sell：作后置定语，修饰 good work"], collocations: ["be interviewed（接受采访）","a lack of demand（需求不足）","a lack of good work（好作品匮乏）"] }},
    { num: "⑥", en: "The three Ds—death, debt and divorce—still deliver works of art to the market.", ref: "3D——死亡、债务和离婚——依然是将艺术品推向市场的三大因素。",
      ai: { backbone: "主语 The three Ds、谓语 deliver、宾语 works of art", structure: ["破折号间的 death, debt and divorce：作 The three Ds 的同位语，解释三个D","介词短语 to the market：说明去向","副词 still：作状语，表示“仍然”"], collocations: ["the three Ds（三个D：死亡、债务、离婚）","deliver works of art（提供艺术品）"] }},
    { num: "⑦", en: "But anyone who does not have to sell is keeping away, waiting for confidence to return.", ref: "但那些不是非卖不可的人都在远离市场，等待市场信心的回转。",
      ai: { backbone: "主句：主语 anyone、谓语 is keeping away；定语从句 who does not have to sell", structure: ["转折连词 But：表转折","定语从句 who does not have to sell：修饰 anyone","现在分词短语 waiting for confidence to return：作伴随状语","不定式短语 to return：作 confidence 的宾补"], collocations: ["keep away（保持距离）","wait for（等待）","confidence to return（信心恢复）"] }}
    ]
  },
  {
    day: 104,
    type: "英二",
    source: "2010 Text 2",
    zh: "在弗吉尼亚郊区一个住所的客厅里，我正在一次小型聚会上发言——那是一个女性团体，但也邀请了男性参加。整个晚上，有位男士表现得特别健谈，频繁地发表观点、讲述趣闻轶事，而他的妻子则静静地坐在他身旁的沙发上。聚会接近尾声时，我评论说，女人经常会抱怨丈夫不与自己交谈。这位男士立即点头表示同意。他指了指妻子说:“她是我们家的话匣子。满屋哄堂大笑；这位男士一脸茫然和受伤。“这是真的，”他解释说。“我下班回家后总是无话可说。如果她不一直和我说话，我们整晚都会在沉默中度过。这段情节证明了一种具有讽刺意味的现象确实存在：尽管美国男性在公共场合常常比女性更加健谈，在家里却比妻子话少。而正是这种模式正在严重破坏婚姻。",
    sentences: [
    { num: "①", en: "I was addressing a small gathering in a suburban Virginia living room—a women’s group that had invited men to join them.", ref: "在弗吉尼亚郊区一个住所的客厅里，我正在一次小型聚会上发言——那是一个女性团体，但也邀请了男性参加。",
      ai: { backbone: "主语 I、谓语 was addressing、宾语 a small gathering", structure: ["介词短语 in a suburban Virginia living room：说明地点","破折号后的名词短语 a women’s group that had invited men to join them：作 gathering 的同位语，说明听众","定语从句 that had invited men to join them：修饰 group","不定式短语 to join them：作 men 的宾补"], collocations: ["address a gathering（向聚会致辞）","a suburban living room（郊区客厅）","invite sb. to do（邀请某人做某事）"] }},
    { num: "②", en: "Throughout the evening, one man had been particularly talkative, frequently offering ideas and anecdotes, while his wife sat silently beside him on the couch.", ref: "整个晚上，有位男士表现得特别健谈，频繁地发表观点、讲述趣闻轶事，而他的妻子则静静地坐在他身旁的沙发上。",
      ai: { backbone: "主句：主语 one man、谓语 had been talkative；时间状语 Throughout the evening", structure: ["副词 particularly：作状语，修饰 talkative","现在分词短语 frequently offering ideas and anecdotes：作伴随状语","时间状语从句 while his wife sat silently beside him on the couch：表示“而……”","介词短语 beside him on the couch：说明位置"], collocations: ["throughout the evening（整个晚上）","offer ideas and anecdotes（提供观点和趣闻）","sit silently（默不作声地坐着）"] }},
    { num: "③", en: "Toward the end of the evening, I commented that women frequently complain that their husbands don’t talk to them.", ref: "聚会接近尾声时，我评论说，女人经常会抱怨丈夫不与自己交谈。",
      ai: { backbone: "主句：主语 I、谓语 commented、宾语从句 that women frequently complain", structure: ["时间状语 Toward the end of the evening：说明时间","宾语从句 that women frequently complain that their husbands don’t talk to them：作 commented 的宾语","宾语从句 that their husbands don’t talk to them：作 complain 的宾语"], collocations: ["toward the end of（临近……结束时）","comment that（评论说）","complain that（抱怨说）"] }},
    { num: "④", en: "This man quickly nodded in agreement.", ref: "这位男士立即点头表示同意。",
      ai: { backbone: "主语 This man、谓语 nodded、状语 in agreement", structure: ["副词 quickly：作状语","介词短语 in agreement：说明点头表示同意"], collocations: ["nod in agreement（点头同意）"] }},
    { num: "⑤", en: "He gestured toward his wife and said, “She’s the talker in our family.”", ref: "他指了指妻子说:“她是我们家的话匣子。",
      ai: { backbone: "主句：主语 He、谓语 gestured toward、宾语 his wife；并列句 said", structure: ["介词短语 toward his wife：说明手势方向","引语 “She’s the talker in our family.”：作 said 的宾语","介词短语 in our family：说明范围"], collocations: ["gesture toward（朝……做手势）","the talker（爱说话的人）"] }},
    { num: "⑥", en: "The room burst into laughter; the man looked puzzled and hurt.", ref: "满屋哄堂大笑；这位男士一脸茫然和受伤。",
      ai: { backbone: "并列句：句1 主语 The room、谓语 burst into laughter；句2 主语 the man、谓语 looked puzzled and hurt", structure: ["分号连接两个分句","并列表语 puzzled and hurt：说明男子当时的神态"], collocations: ["burst into laughter（突然大笑起来）","look puzzled and hurt（显得困惑又受伤）"] }},
    { num: "⑦", en: "“It’s true,” he explained.", ref: "“这是真的，”他解释说。",
      ai: { backbone: "主语 It、谓语 is、表语 true；主句 he explained", structure: ["引语 “It’s true,”：作 explained 的宾语"], collocations: ["explain（解释）"] }},
    { num: "⑧", en: "“When I come home from work I have nothing to say.", ref: "“我下班回家后总是无话可说。",
      ai: { backbone: "主句：主语 I、谓语 have nothing to say；时间状语从句 When I come home from work", structure: ["时间状语从句 When I come home from work：说明时间","介词短语 from work：说明地点","不定式短语 to say：作后置定语，修饰 nothing"], collocations: ["come home from work（下班回家）","have nothing to say（无话可说）"] }},
    { num: "⑨", en: "If she didn’t keep the conversation going, we’d spend the whole evening in silence.”", ref: "如果她不一直和我说话，我们整晚都会在沉默中度过。",
      ai: { backbone: "主句：主语 we、谓语 would spend、宾语 the whole evening；条件状语从句 If she didn’t keep the conversation going", structure: ["条件状语从句 If she didn’t keep the conversation going：虚拟语气，表示与现在事实相反","宾语补足语 going：说明使谈话继续进行","介词短语 in silence：说明度过夜晚的方式"], collocations: ["keep...going（使……继续）","in silence（沉默地）","spend the evening（度过夜晚）"] }},
    { num: "⑩", en: "This episode crystallizes the irony that although American men tend to talk more than women in public situations, they often talk less at home.", ref: "这段情节证明了一种具有讽刺意味的现象确实存在：尽管美国男性在公共场合常常比女性更加健谈，在家里却比妻子话少。",
      ai: { backbone: "主语 This episode、谓语 crystallizes、宾语 the irony", structure: ["同位语从句 that although American men tend to talk more than women in public situations, they often talk less at home：解释说明 the irony","让步状语从句 although American men tend to talk more than women in public situations：嵌入同位语从句中","介词短语 in public situations：说明公共场合","介词短语 at home：说明家里"], collocations: ["crystallize（使具体化，明确化）","in public situations（在公共场合）","talk less at home（在家话更少）"] }},
    { num: "⑪", en: "And this pattern is wreaking havoc with marriage.", ref: "而正是这种模式正在严重破坏婚姻。",
      ai: { backbone: "主语 this pattern、谓语 is wreaking havoc、状语 with marriage", structure: ["介词短语 with marriage：说明受害的对象"], collocations: ["wreak havoc with（对……造成严重破坏）"] }}
    ]
  },
  {
    day: 105,
    type: "英二",
    source: "2010 Text 2",
    zh: "20 世纪 70 年代末，政治学家 AndrewHacker 就注意到了这种模式。社会学家 Catherine KohlerRiessman 在其新书《离婚谈》中提到，她所访问的绝大多数女性将其离婚归咎于“缺乏沟通”，但只有极少数男性如此认为。鉴于美国目前接近 50%的离婚率，这（缺乏沟通）每年会导致美国几百万离婚案例的产生——可谓是沟通不良引发的传染病。",
    sentences: [
    { num: "①", en: "The pattern was observed by political scientist Andrew Hacker in the late 1970s.", ref: "20 世纪 70 年代末，政治学家 AndrewHacker 就注意到了这种模式。",
      ai: { backbone: "主语 The pattern、谓语 was observed；状语 by political scientist Andrew Hacker", structure: ["介词短语 by political scientist Andrew Hacker：引出观察者","时间状语 in the late 1970s：说明时间"], collocations: ["observe a pattern（观察到一个模式）","in the late 1970s（在20世纪70年代末）"] }},
    { num: "②", en: "Sociologist Catherine Kohler Riessman reports in her new book Divorce Talk that most of the women she interviewed—but only a few of the men—gave lack of communication as the reason for their divorces.", ref: "社会学家 Catherine KohlerRiessman 在其新书《离婚谈》中提到，她所访问的绝大多数女性将其离婚归咎于“缺乏沟通”，但只有极少数男性如此认为。",
      ai: { backbone: "主语 Sociologist Catherine Kohler Riessman、谓语 reports、宾语从句 that most of the women gave lack of communication as the reason", structure: ["介词短语 in her new book Divorce Talk：说明出处","宾语从句 that most of the women she interviewed—but only a few of the men—gave lack of communication as the reason for their divorces：作 reports 的宾语","定语从句 she interviewed：修饰 the women（省略了关系代词 whom）","破折号间的插入语 but only a few of the men：作补充对比","介词短语 for their divorces：说明原因"], collocations: ["report in one’s book（在书中报告）","lack of communication（缺乏沟通）","give...as the reason for（把……作为……的原因）"] }},
    { num: "③", en: "Given the current divorce rate of nearly 50 percent, that amounts to millions of cases in the United States every year—a virtual epidemic of failed conversation.", ref: "鉴于美国目前接近 50%的离婚率，这（缺乏沟通）每年会导致美国几百万离婚案例的产生——可谓是沟通不良引发的传染病。",
      ai: { backbone: "主句：主语 that、谓语 amounts to、宾语 millions of cases；原因状语 Given the current divorce rate", structure: ["介词短语 Given the current divorce rate of nearly 50 percent：作条件/原因状语，表示“鉴于”","介词短语 in the United States：说明地点","时间状语 every year：说明频率","破折号后的名词短语 a virtual epidemic of failed conversation：作同位语，概括说明","介词短语 of failed conversation：作后置定语，修饰 epidemic"], collocations: ["given（鉴于）","divorce rate（离婚率）","amount to（总计达到）","millions of cases（数以百万计的案例）","a virtual epidemic（几乎成了一种流行病）","failed conversation（失败的交谈）"] }}
    ]
  },
  {
    day: 106,
    type: "英二",
    source: "2010 Text 2",
    zh: "据我的个人研究，女性对丈夫的抱怨大多不是集中在一些看得见摸得着的不平等现象，例如为陪伴丈夫追随他的事业而放弃了发展自己事业的机会，或者她们所承担的日常生活琐事远远超过她们份内的部分，如清洁、下厨和安排社交活动。相反，她们的抱怨总是集中在交流问题上，如“他不听我说话”，“他不和我说话”。与 Hacker 几年前发现的一样，我发现多数妻子都期望丈夫首先是自己的交谈伙伴，但是很少有丈夫对妻子抱有同样的期望。简言之，最能形象表现目前这种危机的是这样一幅经典漫画场景:一个男人坐在早餐桌边，手中报纸挡着他的脸，一个女人怒视着报纸背面，很想交谈。",
    sentences: [
    { num: "①", en: "In my own research, complaints from women about their husbands most often focused not on tangible inequities such as having given up the chance for a career to accompany a husband to his, or doing far more than their share of daily life-support work like cleaning, cooking, social arrangements.", ref: "据我的个人研究，女性对丈夫的抱怨大多不是集中在一些看得见摸得着的不平等现象，例如为陪伴丈夫追随他的事业而放弃了发展自己事业的机会，或者她们所承担的日常生活琐事远远超过她们份内的部分，如清洁、下厨和安排社交活动。",
      ai: { backbone: "主语 complaints from women、谓语 focused、状语 not on tangible inequities", structure: ["介词短语 In my own research：作状语","介词短语 about their husbands：作后置定语，修饰 complaints","介词短语 not on tangible inequities：与 focus 搭配，not 表示否定","such as 引导的并列举例：having given up the chance for a career to accompany a husband to his, or doing far more than their share of daily life-support work like cleaning, cooking, social arrangements","动名词短语 having given up the chance：作举例之一","动名词短语 doing far more than their share：作举例之二","介词短语 like cleaning, cooking, social arrangements：举例说明日常生活支持工作"], collocations: ["in one’s own research（在某人自己的研究中）","focus on（聚焦于）","tangible inequities（实实在在的不平等）","give up the chance for（放弃……的机会）","daily life-support work（日常生活支持工作）","far more than their share（远超她们应分担的份额）"] }},
    { num: "②", en: "Instead, they focused on communication: “He doesn’t listen to me,” “He doesn’t talk to me.”", ref: "相反，她们的抱怨总是集中在交流问题上，如“他不听我说话”，“他不和我说话”。",
      ai: { backbone: "主语 they、谓语 focused on、宾语 communication", structure: ["副词 Instead：作状语，表示“相反”","冒号后的引语 “He doesn’t listen to me,” “He doesn’t talk to me.”：具体说明沟通方面的抱怨"], collocations: ["instead（相反）","focus on（聚焦于）","listen to（倾听）"] }},
    { num: "③", en: "I found, as Hacker observed years before, that most wives want their husbands to be, first and foremost, conversational partners, but few husbands share this expectation of their wives.", ref: "与 Hacker 几年前发现的一样，我发现多数妻子都期望丈夫首先是自己的交谈伙伴，但是很少有丈夫对妻子抱有同样的期望。",
      ai: { backbone: "主句：主语 I、谓语 found、宾语从句 that most wives want their husbands to be conversational partners", structure: ["时间状语从句 as Hacker observed years before：说明来源","宾语从句 that most wives want their husbands to be, first and foremost, conversational partners, but few husbands share this expectation of their wives：作 found 的宾语","插入语 first and foremost：表示“首先”","并列分句 but few husbands share this expectation of their wives：表示转折"], collocations: ["conversational partners（交谈伙伴）","first and foremost（首先）","share the expectation（有同样的期望）"] }},
    { num: "④", en: "In short, the image that best represents the current crisis is the stereotypical cartoon scene of a man sitting at the breakfast table with a newspaper held up in front of his face, while a woman glares at the back of it, wanting to talk.", ref: "简言之，最能形象表现目前这种危机的是这样一幅经典漫画场景:一个男人坐在早餐桌边，手中报纸挡着他的脸，一个女人怒视着报纸背面，很想交谈。",
      ai: { backbone: "主语 the image、谓语 is、表语 the stereotypical cartoon scene", structure: ["介词短语 In short：作评注性状语","定语从句 that best represents the current crisis：修饰 the image","现在分词短语 of a man sitting at the breakfast table：作后置定语，修饰 scene","介词短语 with a newspaper held up in front of his face：作伴随状语","现在分词短语 held up in front of his face：作宾语补足语","时间状语从句 while a woman glares at the back of it：表示“而……”","现在分词短语 wanting to talk：作伴随状语，说明女人的愿望"], collocations: ["in short（简而言之）","represent the crisis（代表这场危机）","stereotypical cartoon scene（典型的卡通场景）","glare at（怒视）"] }}
    ],
    analysis: [
      {
        sentNum: "④",
        vocab: [
      { raw: "representv.代表crisisn.危机", word: "represent", meaning: "v.代表crisisn.危机" },
      { raw: "stereotypicaladj.刻板印象的，类型化的", word: "stereotypical", meaning: "adj.刻板印象的，类型化的" },
      { raw: "inshort总之，简言之", word: "inshort总之，简言之", meaning: "" },
      { raw: "holdup举起，支撑", word: "holdup举起，支撑", meaning: "" },
      { raw: "glareat怒视", word: "glareat怒视", meaning: "" }
    ],
        split: "Inshort,//theimage//thatbestrepresentsthecurrentcrisisisthestereotypical cartoonscene//ofaman//sittingatthebreakfasttable//withanewspaperheldup//in frontofhisface,//whileawomanglaresatthebackofit,//wantingtotalk.",
        grammar: ["主干：主+系+表", "主干结构提炼：theimageisthestereotypicalcartoonscene", "that引导定语从句（修饰image）", "ofaman...face是介词短语作同位语（解释说明scene）", "sittingatthebreakfasttable是现在分词短语作后置定语（修饰man）", "withanewspaperheldupinfrontofhisface是介词短语作伴随状语", "while表示对比，意为“而”，连接两个同时发生的场景", "wantingtotalk是现在分词短语作伴随状语"],
        ref: "简言之，最能形象表现目前这种危机的是这样一幅经典漫画场景：一个男人坐在早餐桌边，手中报纸挡着他的脸，一个女人怒视着报纸背面，很想交谈。"
      }
    ]
  },
  {
    day: 107,
    type: "英二",
    source: "2010 Text 3",
    zh: "过去十年来，许多公司已经把“在消费者中生成自动行为——习惯”这一艺术发展到了完美的地步。当消费者响应一系列精心设计的日常暗示、几乎不假思索地吃零食或擦桌台之时，这些习惯已经帮助公司赚取了数十亿美元。伦敦卫生和热带医药学院卫生中心主任柯提斯博士称，“一些基本的公共卫生问题，比如说，手脏了却没有养成用肥皂清洗的习惯，只因为我们无法弄清如何改变人们的习惯，这些问题在继续夺取人们的生命。我们想要向私营企业学习如何塑造新的自动行为。”",
    sentences: [
    { num: "①", en: "Over the past decade, many companies had perfected the art of creating automatic behaviors—habits—among consumers.", ref: "过去十年来，许多公司已经把“在消费者中生成自动行为——习惯”这一艺术发展到了完美的地步。",
      ai: { backbone: "主语 many companies、谓语 had perfected、宾语 the art of creating automatic behaviors", structure: ["时间状语 Over the past decade：说明时间","介词短语 of creating automatic behaviors：作后置定语，修饰 art","破折号间的 habits：作 automatic behaviors 的同位语","介词短语 among consumers：说明对象"], collocations: ["over the past decade（在过去十年里）","perfect the art of（完善……的艺术）","automatic behaviors（自动行为）"] }},
    { num: "②", en: "These habits have helped companies earn billions of dollars when customers eat snacks or wipe counters almost without thinking, often in response to a carefully designed set of daily cues.", ref: "当消费者响应一系列精心设计的日常暗示、几乎不假思索地吃零食或擦桌台之时，这些习惯已经帮助公司赚取了数十亿美元。",
      ai: { backbone: "主句：主语 These habits、谓语 have helped、宾语 companies earn billions of dollars", structure: ["时间状语从句 when customers eat snacks or wipe counters almost without thinking：说明场景","介词短语 almost without thinking：作方式状语","介词短语 in response to a carefully designed set of daily cues：说明原因","过去分词短语 carefully designed：作定语，修饰 cues"], collocations: ["earn billions of dollars（赚数十亿美元）","eat snacks（吃零食）","in response to（作为对……的回应）","a set of daily cues（一组日常提示）","carefully designed（精心设计的）"] }},
    { num: "③", en: "“There are fundamental public health problems, like dirty hands instead of a soap habit, that remain killers only because we can’t figure out how to change people’s habits,” said Dr. Curtis, the director of the Hygiene Center at the London School of Hygiene & Tropical Medicine.", ref: "伦敦卫生和热带医药学院卫生中心主任柯提斯博士称，“一些基本的公共卫生问题，比如说，手脏了却没有养成用肥皂清洗的习惯，只因为我们无法弄清如何改变人们的习惯，这些问题在继续夺取人们的生命。",
      ai: { backbone: "引语：There be 结构（fundamental public health problems）；定语从句 that remain killers；原因状语 because we can’t figure out how to change people’s habits；主句：谓语 said、主语 Dr. Curtis（倒装）", structure: ["介词短语 like dirty hands instead of a soap habit：举例说明公共卫生问题","定语从句 that remain killers：修饰 problems","原因状语从句 because we can’t figure out how to change people’s habits：说明原因","名词短语 the director of the Hygiene Center at the London School of Hygiene & Tropical Medicine：作同位语，说明 Dr. Curtis 的身份","宾语从句 how to change people’s habits：作 figure out 的宾语"], collocations: ["fundamental public health problems（基本的公共卫生问题）","a soap habit（用肥皂洗手的习惯）","figure out（弄清楚）","the Hygiene Center（卫生中心）"] }},
    { num: "④", en: "“We wanted to learn from private industry how to create new behaviors that happen automatically.”", ref: "我们想要向私营企业学习如何塑造新的自动行为。”",
      ai: { backbone: "主语 We、谓语 wanted to learn、宾语 from private industry；宾语 how to create new behaviors", structure: ["介词短语 from private industry：说明学习对象","宾语从句 how to create new behaviors that happen automatically：作 learn 的宾语","定语从句 that happen automatically：修饰 behaviors"], collocations: ["want to learn from（想向……学习）","private industry（私营产业）","create new behaviors（创造新的行为）","happen automatically（自动发生）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "snackn.零食，小吃", word: "snack", meaning: "n.零食，小吃" },
      { raw: "wipev.擦掉，抹掉", word: "wipe", meaning: "v.擦掉，抹掉" },
      { raw: "countern.柜台", word: "counter", meaning: "n.柜台" },
      { raw: "dailycue日常提示", word: "dailycue日常提", meaning: "示" },
      { raw: "inresponseto作为对...的回应（暗含因果关系）", word: "inresponseto", meaning: "作为对...的回应（暗含因果关系）" }
    ],
        split: "Thesehabitshavehelpedcompaniesearnbillionsofdollars//whencustomerseat snacks//orwipecounters//almostwithoutthinking,//ofteninresponsetoacarefully designedsetofdailycues.",
        grammar: ["主干：主+谓+宾+宾补", "主干结构提炼：Thesehabitshavehelpedcompaniesearnbillionsofdollars", "when引导时间状语从句", "almostwithoutthinking是介词短语作状语（修饰eat和wipe）", "ofteninresponseto...cues是介词短语作状语，进一步解释说明行为的原因"],
        ref: "当消费者响应一系列精心设计的日常暗示、几乎不假思索地吃零食或擦桌台之时，这些习惯已经帮助公司赚取了数十亿美元。"
      }
    ]
  },
  {
    day: 108,
    type: "英二",
    source: "2010 Text 3",
    zh: "柯提斯博士求助的公司有宝洁、高露洁和联合利华，这些公司曾投资几亿美元用于发掘消费者生活中的微妙暗示，并利用它们引入新惯例。如果你观察得足够仔细，就会发现我们每天都在使用的许多产品——口香糖、润肤乳、消毒湿巾、空气清新剂、净水器健康小吃、牙齿美白剂、衣物柔顺剂、维生素等，都是“制造习惯”的产物。一个世纪以前，很少有人习惯性地一天刷牙多次。而今天，受精明的广告活动和公共卫生运动的影响，许多美国人会习惯性地每天给他们那如珍珠般洁白的牙齿做两次龋齿预防刷洗，他们使用的，往往就是高露洁、佳洁士或者其他某种品牌。",
    sentences: [
    { num: "①", en: "The companies that Dr. Curtis turned to—Procter & Gamble, Colgate-Palmolive and Unilever—had invested hundreds of millions of dollars finding the subtle cues in consumers’ lives that corporations could use to introduce new routines.", ref: "柯提斯博士求助的公司有宝洁、高露洁和联合利华，这些公司曾投资几亿美元用于发掘消费者生活中的微妙暗示，并利用它们引入新惯例。",
      ai: { backbone: "主语 The companies、谓语 had invested、宾语 hundreds of millions of dollars", structure: ["定语从句 that Dr. Curtis turned to：修饰 The companies","破折号间的 Procter & Gamble, Colgate-Palmolive and Unilever：作 The companies 的同位语","现在分词短语 finding the subtle cues in consumers’ lives：作目的状语","定语从句 that corporations could use to introduce new routines：修饰 cues","不定式短语 to introduce new routines：作目的状语"], collocations: ["turn to（求助于）","invest hundreds of millions of dollars（投入数亿美元）","subtle cues（微妙的暗示）","introduce new routines（引入新的日常习惯）"] }},
    { num: "②", en: "If you look hard enough, you’ll find that many of the products we use every day—chewing gums, skin moisturizers, disinfecting wipes, air fresheners, water purifiers, health snacks, teeth whiteners, fabric softeners, vitamins—are results of manufactured habits.", ref: "如果你观察得足够仔细，就会发现我们每天都在使用的许多产品——口香糖、润肤乳、消毒湿巾、空气清新剂、净水器健康小吃、牙齿美白剂、衣物柔顺剂、维生素等，都是“制造习惯”的产物。",
      ai: { backbone: "主句：主语 you、谓语 will find、宾语从句 that many of the products are results of manufactured habits；条件状语从句 If you look hard enough", structure: ["条件状语从句 If you look hard enough：说明条件","宾语从句 that many of the products we use every day are results of manufactured habits：作 find 的宾语","定语从句 we use every day：修饰 the products（省略了关系代词 that）","破折号间的列举 chewing gums, skin moisturizers, disinfecting wipes, air fresheners, water purifiers, health snacks, teeth whiteners, fabric softeners, vitamins：具体列举日用产品"], collocations: ["look hard enough（仔细找）","skin moisturizers（润肤霜）","air fresheners（空气清新剂）","manufactured habits（被制造出来的习惯）"] }},
    { num: "③", en: "A century ago, few people regularly brushed their teeth multiple times a day.", ref: "一个世纪以前，很少有人习惯性地一天刷牙多次。",
      ai: { backbone: "主语 few people、谓语 brushed、宾语 their teeth", structure: ["时间状语 A century ago：说明时间","副词 regularly：作状语","介词短语 multiple times a day：说明频率"], collocations: ["a century ago（一个世纪前）","brush one’s teeth（刷牙）","multiple times a day（一天多次）"] }},
    { num: "④", en: "Today, because of shrewd advertising and public health campaigns, many Americans habitually give their pearly whites a cavity-preventing scrub twice a day, often with Colgate, Crest or one of the other brands.", ref: "而今天，受精明的广告活动和公共卫生运动的影响，许多美国人会习惯性地每天给他们那如珍珠般洁白的牙齿做两次龋齿预防刷洗，他们使用的，往往就是高露洁、佳洁士或者其他某种品牌。",
      ai: { backbone: "主句：主语 many Americans、谓语 give、宾语 their pearly whites、宾补 a cavity-preventing scrub", structure: ["时间状语 Today：说明时间","原因状语 because of shrewd advertising and public health campaigns：说明原因","副词 habitually：作状语","介词短语 twice a day：说明频率","介词短语 with Colgate, Crest or one of the other brands：说明品牌","复合形容词 cavity-preventing：作定语，修饰 scrub"], collocations: ["shrewd advertising（精明的广告）","public health campaigns（公共卫生宣传运动）","pearly whites（洁白的牙齿）","cavity-preventing scrub（防蛀擦洗）"] }}
    ]
  },
  {
    day: 109,
    type: "英二",
    source: "2010 Text 3",
    zh: "几十年之前，许多人不会在非就餐时间喝水。后来，饮料公司开始将遥远地带的泉水装入瓶中，现在办公室职员整天都在不假思索地喝着瓶装水。口香糖从前主要是处于青春期的男孩儿购买，而现在的商业广告中，口香糖被定位为饭后使用的口气清新剂和牙齿清洁剂。润肤乳被广告宣传成早晨美容程序的一部分，不知不觉插入梳头和化妆之间。",
    sentences: [
    { num: "①", en: "A few decades ago, many people didn’t drink water outside of a meal.", ref: "几十年之前，许多人不会在非就餐时间喝水。",
      ai: { backbone: "主语 many people、谓语 didn’t drink、宾语 water；状语 outside of a meal", structure: ["时间状语 A few decades ago：说明时间","介词短语 outside of a meal：说明喝水的情境"], collocations: ["a few decades ago（几十年前）","outside of a meal（非用餐时）"] }},
    { num: "②", en: "Then beverage companies started bottling the production of far-off springs, and now office workers unthinkingly sip bottled water all day long.", ref: "后来，饮料公司开始将遥远地带的泉水装入瓶中，现在办公室职员整天都在不假思索地喝着瓶装水。",
      ai: { backbone: "并列句：句1 主语 beverage companies、谓语 started bottling、宾语 the production；句2 主语 office workers、谓语 sip、宾语 bottled water", structure: ["时间状语 Then：作状语","动名词短语 bottling the production of far-off springs：作 started 的宾语","时间状语 now：说明当前","副词 unthinkingly：作状语，修饰 sip","介词短语 all day long：说明持续时间"], collocations: ["beverage companies（饮料公司）","far-off springs（遥远的泉水）","bottled water（瓶装水）","all day long（一整天）","sip（小口喝）"] }},
    { num: "③", en: "Chewing gum, once bought primarily by adolescent boys, is now featured in commercials as a breath freshener and teeth cleanser for use after a meal.", ref: "口香糖从前主要是处于青春期的男孩儿购买，而现在的商业广告中，口香糖被定位为饭后使用的口气清新剂和牙齿清洁剂。",
      ai: { backbone: "主语 Chewing gum、谓语 is now featured、状语 in commercials", structure: ["过去分词短语 once bought primarily by adolescent boys：作后置定语，修饰 Chewing gum","介词短语 as a breath freshener and teeth cleanser：说明被宣传的角色","介词短语 for use after a meal：说明用途"], collocations: ["chewing gum（口香糖）","be bought by（被……购买）","adolescent boys（青春期男孩）","a breath freshener（口气清新剂）","a teeth cleanser（牙齿清洁剂）"] }},
    { num: "④", en: "Skin moisturizers are advertised as part of morning beauty rituals, slipped in between hair brushing and putting on makeup.", ref: "润肤乳被广告宣传成早晨美容程序的一部分，不知不觉插入梳头和化妆之间。",
      ai: { backbone: "主语 Skin moisturizers、谓语 are advertised、状语 as part of morning beauty rituals", structure: ["过去分词短语 slipped in between hair brushing and putting on makeup：作伴随状语，说明使用环节","介词短语 between hair brushing and putting on makeup：说明在哪个环节之间"], collocations: ["skin moisturizers（润肤霜）","be advertised as（被宣传为）","morning beauty rituals（早晨的美容仪式）","hair brushing（梳头发）","putting on makeup（化妆）"] }}
    ]
  },
  {
    day: 110,
    type: "英二",
    source: "2010 Text 3",
    zh: "最近从宝洁退休的消费心理学家卡罗尔·伯宁说：“如果能成为每天或每周的惯例，那我们的产品就成功了”。宝洁公司去年卖出了 760 亿美元的汰渍、佳洁士和其他产品。创建积极习惯是改善消费者生活的重要部分，它也对使新产品具有商业可行性至关重要。通过实验和观察，伯宁博士等社会科学家已了解到，通过大量无休止的广告将“某些行为”与“习惯暗示”联系起来的做法是有效的。随着这门新兴习惯科学的兴起，这些策略被用于销售价值尚属疑问的美容霜或者不健康的食品，从而引发了激烈辩论。",
    sentences: [
    { num: "①", en: "“Our products succeed when they become part of daily or weekly patterns,” said Carol Berning, a consumer psychologist who recently retired from Procter & Gamble, the company that sold $76 billion of Tide, Crest and other products last year.", ref: "最近从宝洁退休的消费心理学家卡罗尔·伯宁说：“如果能成为每天或每周的惯例，那我们的产品就成功了”。宝洁公司去年卖出了 760 亿美元的汰渍、佳洁士和其他产品。",
      ai: { backbone: "引语主句：主语 Our products、谓语 succeed；时间状语从句 when they become part of daily or weekly patterns；主句：谓语 said、主语 Carol Berning（倒装）", structure: ["时间状语从句 when they become part of daily or weekly patterns：说明成功时机","名词短语 a consumer psychologist：作同位语，说明 Carol Berning 的身份","非限制性定语从句 who recently retired from Procter & Gamble：修饰 Carol Berning","名词短语 the company that sold $76 billion of Tide, Crest and other products last year：作 Procter & Gamble 的同位语","定语从句 that sold $76 billion of Tide, Crest and other products last year：修饰 company"], collocations: ["become part of（成为……的一部分）","daily or weekly patterns（每日或每周的习惯模式）","consumer psychologist（消费者心理学家）","retire from（从……退休）"] }},
    { num: "②", en: "“Creating positive habits is a huge part of improving our consumers’ lives, and it’s essential to making new products commercially viable.”", ref: "创建积极习惯是改善消费者生活的重要部分，它也对使新产品具有商业可行性至关重要。",
      ai: { backbone: "并列句：句1 主语 Creating positive habits、谓语 is、表语 a huge part；句2 主语 it、谓语 is essential", structure: ["动名词短语 Creating positive habits：作主语","介词短语 of improving our consumers’ lives：作后置定语，修饰 part","并列连词 and：连接两个分句","不定式短语 to making new products commercially viable：作 essential 的宾语（be essential to doing）"], collocations: ["create positive habits（培养积极的习惯）","a huge part of（……的重要部分）","improve consumers’ lives（改善消费者的生活）","be essential to doing（对做某事至关重要）","commercially viable（具有商业可行性的）"] }},
    { num: "③", en: "Through experiments and observation, social scientists like Dr. Berning have learned that there is power in tying certain behaviors to habitual cues through ruthless advertising.", ref: "通过实验和观察，伯宁博士等社会科学家已了解到，通过大量无休止的广告将“某些行为”与“习惯暗示”联系起来的做法是有效的。",
      ai: { backbone: "主句：主语 social scientists、谓语 have learned、宾语从句 that there is power in tying certain behaviors", structure: ["介词短语 Through experiments and observation：作方式状语","介词短语 like Dr. Berning：举例说明","宾语从句 that there is power in tying certain behaviors to habitual cues through ruthless advertising：作 learned 的宾语","动名词短语 tying certain behaviors to habitual cues：作介词 in 的宾语","介词短语 through ruthless advertising：作方式状语"], collocations: ["through experiments and observation（通过实验和观察）","there is power in doing（做某事有其力量）","tie...to...（把……与……联系起来）","habitual cues（习惯性提示）","ruthless advertising（无情的广告轰炸）"] }},
    { num: "④", en: "As this new science of habit has emerged, controversies have erupted when the tactics have been used to sell questionable beauty creams or unhealthy foods.", ref: "随着这门新兴习惯科学的兴起，这些策略被用于销售价值尚属疑问的美容霜或者不健康的食品，从而引发了激烈辩论。",
      ai: { backbone: "主句：主语 controversies、谓语 have erupted；时间状语从句 As this new science of habit has emerged", structure: ["时间状语从句 As this new science of habit has emerged：表示“随着……的出现”","时间状语从句 when the tactics have been used to sell questionable beauty creams or unhealthy foods：说明争议爆发的时机"], collocations: ["the science of habit（习惯科学）","controversies erupt（争议爆发）","questionable beauty creams（有问题的美容霜）","unhealthy foods（不健康的食品）"] }}
    ]
  },
  {
    day: 111,
    type: "英二",
    source: "2010 Text 4",
    zh: "许多美国人把陪审团制度看作是关键民主价值观的具体表现，该制度包括以下原则：所有满足最低年龄和文化要求的公民都具备同等资格担任陪审员；陪审员应从社会各部门的典型代表中随机挑选；任何公民不得由于种族、宗教、性别和民族出身被剥夺担任陪审员的权利；被告人有权利接受由同等地位的人进行的审判；审判结果应该代表社会良知，而不仅仅是法律条文的字面意义。陪审团还被看作是体现直接民主而非代议制民主的最佳现存典范。在直接民主政体中，公民轮流进行自治，而不是选举代表来替自己治理。",
    sentences: [
    { num: "①", en: "Many Americans regard the jury system as a concrete expression of crucial democratic values, including the principles that all citizens who meet minimal qualifications of age and literacy are equally competent to serve on juries; that jurors should be selected randomly from a representative cross section of the community; that no citizen should be denied the right to serve on a jury on account of race, religion, sex, or national origin; that defendants are entitled to trial by their peers; and that verdicts should represent the conscience of the community and not just the letter of the law.", ref: "许多美国人把陪审团制度看作是关键民主价值观的具体表现，该制度包括以下原则：所有满足最低年龄和文化要求的公民都具备同等资格担任陪审员；陪审员应从社会各部门的典型代表中随机挑选；任何公民不得由于种族、宗教、性别和民族出身被剥夺担任陪审员的权利；被告人有权利接受由同等地位的人进行的审判；审判结果应该代表社会良知，而不仅仅是法律条文的字面意义。",
      ai: { backbone: "主语 Many Americans、谓语 regard、宾语 the jury system、宾补 as a concrete expression of crucial democratic values", structure: ["介词短语 as a concrete expression：与 regard 搭配，说明把陪审团制度视为……","介词短语 including the principles：作后置定语，补充说明 values 中包含的原则","五个并列的同位语从句解释 the principles：","that all citizens who meet minimal qualifications of age and literacy are equally competent to serve on juries；","that jurors should be selected randomly from a representative cross section of the community；","that no citizen should be denied the right to serve on a jury on account of race, religion, sex, or national origin；","that defendants are entitled to trial by their peers；","and that verdicts should represent the conscience of the community and not just the letter of the law","定语从句 who meet minimal qualifications of age and literacy：修饰 citizens"], collocations: ["regard...as（把……视为）","a concrete expression of（……的具体体现）","democratic values（民主价值观）","meet qualifications（符合条件）","a representative cross section（具有代表性的各阶层）","be denied the right to（被剥夺……的权利）","on account of（由于）","national origin（民族出身）","be entitled to（有权享受）","trial by peers（由同类人审判）","the conscience of the community（社区良知）","the letter of the law（法律条文）"] }},
    { num: "②", en: "The jury is also said to be the best surviving example of direct rather than representative democracy.", ref: "陪审团还被看作是体现直接民主而非代议制民主的最佳现存典范。",
      ai: { backbone: "主语 The jury、谓语 is also said、宾补 to be the best surviving example", structure: ["介词短语 of direct rather than representative democracy：作后置定语，修饰 example"], collocations: ["be said to be（据说）","the best surviving example（现存最好的例子）","direct democracy（直接民主）","representative democracy（代议制民主）"] }},
    { num: "③", en: "In a direct democracy, citizens take turns governing themselves, rather than electing representatives to govern for them.", ref: "在直接民主政体中，公民轮流进行自治，而不是选举代表来替自己治理。",
      ai: { backbone: "主语 citizens、谓语 take turns governing themselves；地点状语 In a direct democracy", structure: ["动名词短语 governing themselves：作 take turns 的宾语","介词短语 rather than electing representatives to govern for them：作比较状语","不定式短语 to govern for them：作 representatives 的宾补"], collocations: ["take turns doing（轮流做某事）","govern themselves（自我治理）","rather than（而不是）","elect representatives（选举代表）"] }}
    ]
  },
  {
    day: 112,
    type: "英二",
    source: "2010 Text 4",
    zh: "但是近至 1968 年，陪审团遴选程序仍然是和这些民主理想相冲突的。例如，在有些州，陪审团职责仅限于由那些一般看来智商学历和道德品格高人一等的人来承担。尽管美国最高法院早在 1880 年的斯特劳德诉西弗吉尼亚州一案中就已经禁止了陪审团遴选中的蓄意种族歧视，但挑选所谓的精英陪审员或者蓝带陪审员的做法，却为绕开这一反歧视及其它反歧视法案提供了一条捷径。【帮你搜索】“蓝带陪审员”（blue-ribbon jury）通常是指由一些具有特殊背景、专业知识或社会地位的人组成的陪审员团队。在一些情况下，选择蓝带陪审员可能是为了确保案件的审判能够更加公正、专业或具有代表性。在美国，蓝带陪审员的概念可能与一些历史和法律背景有关。例如，早在 19 世纪末，美国最高法院就禁止了在陪审团遴选中的蓄意种族歧视，但后来挑选所谓的精英或蓝带陪审员的做法成为了一种绕过反歧视法律的方式。在其他国家或法律体系中，可能也存在类似的概念或做法，但具体含义和应用可能会有所不同。",
    sentences: [
    { num: "①", en: "But as recently as in 1968, jury selection procedures conflicted with these democratic ideals.", ref: "但是近至 1968 年，陪审团遴选程序仍然是和这些民主理想相冲突的。",
      ai: { backbone: "主句：主语 jury selection procedures、谓语 conflicted、状语 with these democratic ideals；时间状语 as recently as in 1968", structure: ["转折连词 But：表转折","介词短语 as recently as in 1968：说明时间，表示“直到最近1968年”","介词短语 with these democratic ideals：与 conflict 搭配"], collocations: ["jury selection procedures（陪审团遴选程序）","conflict with（与……相冲突）","democratic ideals（民主理想）"] }},
    { num: "②", en: "In some states, for example, jury duty was limited to persons of supposedly superior intelligence, education, and moral character.", ref: "例如，在有些州，陪审团职责仅限于由那些一般看来智商学历和道德品格高人一等的人来承担。",
      ai: { backbone: "主语 jury duty、谓语 was limited、状语 to persons of supposedly superior intelligence", structure: ["介词短语 In some states：作状语，说明地点","介词短语 for example：举例说明","介词短语 to persons：与 be limited 搭配","介词短语 of supposedly superior intelligence, education, and moral character：作后置定语，修饰 persons"], collocations: ["be limited to（局限于）","superior intelligence（较高的智力）","moral character（道德品质）"] }},
    { num: "③", en: "Although the Supreme Court of the United States had prohibited intentional racial discrimination in jury selection as early as the 1880 case of Strauder v. West Virginia, the practice of selecting so-called elite or blue-ribbon juries provided a convenient way around this and other antidiscrimination laws.", ref: "尽管美国最高法院早在 1880 年的斯特劳德诉西弗吉尼亚州一案中就已经禁止了陪审团遴选中的蓄意种族歧视，但挑选所谓的精英陪审员或者蓝带陪审员的做法，却为绕开这一反歧视及其它反歧视法案提供了一条捷径。",
      ai: { backbone: "主句：主语 the practice of selecting so-called elite or blue-ribbon juries、谓语 provided、宾语 a convenient way", structure: ["让步状语从句 Although the Supreme Court of the United States had prohibited intentional racial discrimination in jury selection：表示让步","介词短语 as early as the 1880 case of Strauder v. West Virginia：说明时间","介词短语 around this and other antidiscrimination laws：说明规避的对象"], collocations: ["intentional racial discrimination（蓄意的种族歧视）","blue-ribbon juries（精英陪审团）","provide a convenient way around（为绕过……提供便捷方式）","antidiscrimination laws（反歧视法律）"] }}
    ]
  },
  {
    day: 113,
    type: "英二",
    source: "2010 Text 4",
    zh: "同时，直到 20 世纪中叶，陪审团制度才开始常规地将女性纳入其中。虽然早在 1898 年，女性就首次担任过犹他州的陪审员，但直到 20 世纪 40 年代，大多数州才赋予女性承担陪审员职责的资格。而且即便是那时，有些州仍然自动将女性排除在陪审员职责之外，除非她们自己要求将名字纳入陪审团名单。这种做法以家里需要女性的论断为解释依据，致使整个 20世纪 60 年代的陪审团中都鲜有女性。",
    sentences: [
    { num: "①", en: "The system also failed to regularly include women on juries until the mid-20th century.", ref: "同时，直到 20 世纪中叶，陪审团制度才开始常规地将女性纳入其中。",
      ai: { backbone: "主语 The system、谓语 failed to include、宾语 women；时间状语 until the mid-20th century", structure: ["副词 regularly：作状语，修饰 include","介词短语 on juries：说明陪审团中","介词短语 until the mid-20th century：说明时间截止点"], collocations: ["fail to include（未能包含）","the mid-20th century（20世纪中叶）"] }},
    { num: "②", en: "Although women first served on state juries in Utah in 1898, it was not until the 1940s that a majority of states made women eligible for jury duty.", ref: "虽然早在 1898 年，女性就首次担任过犹他州的陪审员，但直到 20 世纪 40 年代，大多数州才赋予女性承担陪审员职责的资格。",
      ai: { backbone: "主句：主语 it、谓语 was not until the 1940s that a majority of states made women eligible（强调句型/时间状语）；让步状语从句 Although women first served", structure: ["让步状语从句 Although women first served on state juries in Utah in 1898：表示让步","强调结构 it was not until...that...：表示“直到……才……”","宾语补足语 eligible for jury duty：说明使女性符合资格"], collocations: ["serve on juries（担任陪审员）","it was not until...that...（直到……才……）","a majority of states（大多数州）","be eligible for（有资格……）","jury duty（陪审义务）"] }},
    { num: "③", en: "Even then several states automatically exempted women from jury duty unless they personally asked to have their names included on the jury list.", ref: "而且即便是那时，有些州仍然自动将女性排除在陪审员职责之外，除非她们自己要求将名字纳入陪审团名单。",
      ai: { backbone: "主句：主语 several states、谓语 exempted、宾语 women、宾补 from jury duty；时间状语 Even then", structure: ["副词 automatically：作状语","介词短语 from jury duty：与 exempt 搭配","条件状语从句 unless they personally asked to have their names included on the jury list：说明例外情况"], collocations: ["exempt sb. from（免除某人的……）","automatically（自动地）","jury list（陪审员名单）","ask to do（要求做某事）"] }},
    { num: "④", en: "This practice was justified by the claim that women were needed at home, and it kept juries unrepresentative of women through the 1960s.", ref: "这种做法以家里需要女性的论断为解释依据，致使整个 20世纪 60 年代的陪审团中都鲜有女性。",
      ai: { backbone: "主句：主语 This practice、谓语 was justified、状语 by the claim；并列句 and it kept juries unrepresentative of women", structure: ["介词短语 by the claim：说明被什么合理化","同位语从句 that women were needed at home：解释说明 the claim","并列分句 and it kept juries unrepresentative of women through the 1960s：说明影响","介词短语 through the 1960s：说明持续时间"], collocations: ["be justified by（被……合理化）","be needed at home（在家被需要）","keep...unrepresentative of（使……不能代表……）"] }}
    ]
  },
  {
    day: 114,
    type: "英二",
    source: "2010 Text 4",
    zh: "1968 年，美国国会通过了《陪审团遴选与服务法案》，从此开创了一个陪审团民主改革的新时代。这一法案废除了对联邦陪审员的特殊教育要求，并要求从社会各阶层民众中随机挑选陪审员。在 1975 年泰勒诉路易斯安那州一案里程碑式的裁定中，最高法院将陪审团成员需代表社会各阶层这一要求延伸至州级层面。泰勒案的裁决同时将陪审团遴选中的性别歧视宣布为违宪，并命令各州采取相同程序来遴选男女陪审员。",
    sentences: [
    { num: "①", en: "In 1968, the Congress of the United States passed the Jury Selection and Service Act, ushering in a new era of democratic reforms for the jury.", ref: "1968 年，美国国会通过了《陪审团遴选与服务法案》，从此开创了一个陪审团民主改革的新时代。",
      ai: { backbone: "主语 the Congress of the United States、谓语 passed、宾语 the Jury Selection and Service Act", structure: ["时间状语 In 1968：说明时间","现在分词短语 ushering in a new era of democratic reforms for the jury：作伴随状语，说明法案的影响"], collocations: ["pass an act（通过法案）","usher in（开启）","a new era of（……的新时代）","democratic reforms（民主改革）"] }},
    { num: "②", en: "This law abolished special educational requirements for federal jurors and required them to be selected at random from a cross section of the entire community.", ref: "这一法案废除了对联邦陪审员的特殊教育要求，并要求从社会各阶层民众中随机挑选陪审员。",
      ai: { backbone: "主语 This law、谓语 abolished、宾语 special educational requirements；并列句 and required them to be selected", structure: ["介词短语 for federal jurors：说明要求针对的对象","并列谓语 required them to be selected at random：与 abolished 并列","被动不定式 to be selected at random：作宾语补足语","介词短语 from a cross section of the entire community：说明遴选范围"], collocations: ["abolish requirements（废除要求）","federal jurors（联邦陪审员）","at random（随机地）","a cross section of（……的各个层面）"] }},
    { num: "③", en: "In the landmark 1975 decision Taylor v. Louisiana, the Supreme Court extended the requirement that juries be representative of all parts of the community to the state level.", ref: "在 1975 年泰勒诉路易斯安那州一案里程碑式的裁定中，最高法院将陪审团成员需代表社会各阶层这一要求延伸至州级层面。",
      ai: { backbone: "主句：主语 the Supreme Court、谓语 extended、宾语 the requirement；时间状语 In the landmark 1975 decision Taylor v. Louisiana", structure: ["介词短语 in the landmark 1975 decision Taylor v. Louisiana：说明出处","同位语从句 that juries be representative of all parts of the community：解释说明 the requirement（虚拟语气）","介词短语 to the state level：说明延伸的对象"], collocations: ["landmark decision（里程碑式的裁决）","extend the requirement（扩大要求）","be representative of（代表……）","all parts of the community（社区的各个部分）"] }},
    { num: "④", en: "The Taylor decision also declared sex discrimination in jury selection to be unconstitutional and ordered states to use the same procedures for selecting male and female jurors.", ref: "泰勒案的裁决同时将陪审团遴选中的性别歧视宣布为违宪，并命令各州采取相同程序来遴选男女陪审员。",
      ai: { backbone: "并列句：句1 主语 The Taylor decision、谓语 declared、宾语 sex discrimination、宾补 to be unconstitutional；句2 主语 states、谓语 ordered、宾语 use the same procedures", structure: ["介词短语 in jury selection：说明歧视发生的环节","并列谓语 and ordered states to use the same procedures：与 declared 并列","介词短语 for selecting male and female jurors：说明程序用于的对象"], collocations: ["declare...to be unconstitutional（宣布……违宪）","sex discrimination（性别歧视）","order sb. to do（命令某人做某事）","select jurors（遴选陪审员）"] }}
    ]
  },
  {
    day: 115,
    type: "英二",
    source: "2011 Text 1",
    zh: "2000 年 1 月，茹斯·西蒙斯作为外部董事加入高盛集团；时隔一年，她成为布朗大学校长。随后的九年里，她似乎设法做到了在没有招致太多非议的同时处理两个角色。到了 2009 年底，西蒙斯女士却因在高盛薪酬委员会的任职而遭受抨击；她怎么能让那些巨额奖金支出毫无察觉地就通过了呢？到第二年 2 月，西蒙斯女士已离开董事会。她说，这个职位太占时间了。【帮你搜索】外部董事，又称非执行董事或独立董事，是指不在公司享有董事职责外的经营管理权的董事会董事。他们不直接参与企业的日常经营管理，主要职责是监督、审查和平衡，以维护公众利益和少数股东的权益。同时，外部董事还需要跟踪和关注公司的运营数据和信息，为公司高级管理层提供有价值的见解。",
    sentences: [
    { num: "①", en: "Ruth Simmons joined Goldman Sachs’s board as an outside director in January 2000; a year later she became president of Brown University.", ref: "2000 年 1 月，茹斯·西蒙斯作为外部董事加入高盛集团；时隔一年，她成为布朗大学校长。",
      ai: { backbone: "并列句：句1 主语 Ruth Simmons、谓语 joined、宾语 Goldman Sachs’s board；句2 主语 she、谓语 became、表语 president", structure: ["介词短语 as an outside director：说明以何种身份加入","时间状语 in January 2000：说明时间","时间状语 a year later：说明时间","介词短语 of Brown University：说明校名"], collocations: ["join the board（加入董事会）","outside director（外部董事）","become president of（成为……的校长）"] }},
    { num: "②", en: "For the rest of the decade she apparently managed both roles without attracting much criticism.", ref: "随后的九年里，她似乎设法做到了在没有招致太多非议的同时处理两个角色。",
      ai: { backbone: "主语 she、谓语 managed、宾语 both roles；状语 without attracting much criticism", structure: ["时间状语 For the rest of the decade：说明时间","副词 apparently：作状语","介词短语 without attracting much criticism：作方式状语，说明未招致批评"], collocations: ["for the rest of the decade（在接下来的十年里）","manage both roles（同时兼顾两个角色）","attract criticism（招致批评）"] }},
    { num: "③", en: "But by the end of 2009 Ms. Simmons was under fire for having sat on Goldman’s compensation committee; how could she have let those enormous bonus payouts pass unremarked?", ref: "到了 2009 年底，西蒙斯女士却因在高盛薪酬委员会的任职而遭受抨击；她怎么能让那些巨额奖金支出毫无察觉地就通过了呢？",
      ai: { backbone: "并列句：句1 主语 Ms. Simmons、谓语 was under fire；原因状语 for having sat on Goldman’s compensation committee；句2 为反问句 how could she have let those bonus payouts pass", structure: ["时间状语 But by the end of 2009：说明时间","介词短语 for having sat on Goldman’s compensation committee：说明受指责的原因","分号连接第二个分句","宾语补足语 pass unremarked：说明听任奖金支出通过而未加评论"], collocations: ["be under fire（受到抨击）","compensation committee（薪酬委员会）","bonus payouts（奖金发放）","pass unremarked（悄无声息地通过）"] }},
    { num: "④", en: "By February the next year Ms. Simmons had left the board.", ref: "到第二年 2 月，西蒙斯女士已离开董事会。",
      ai: { backbone: "主语 Ms. Simmons、谓语 had left、宾语 the board", structure: ["时间状语 By February the next year：说明时间"], collocations: ["leave the board（离开董事会）"] }},
    { num: "⑤", en: "The position was just taking up too much time, she said.", ref: "她说，这个职位太占时间了。",
      ai: { backbone: "主语 The position、谓语 was taking up、宾语 too much time；主句 she said", structure: ["副词 just：作状语，加强语气","引语 The position was just taking up too much time：作 said 的宾语"], collocations: ["take up too much time（占用太多时间）"] }}
    ]
  },
  {
    day: 116,
    type: "英二",
    source: "2011 Text 1",
    zh: "外部董事被认为是公司董事会中有益且更公正的顾问。他们已在别处名成利就，因此应拥有足够的独立性来质疑董事长的提案。假若公司面临灭顶之灾，股票价格大跌，外部董事应能基于自身应付危机的经验向公司提出建议。",
    sentences: [
    { num: "①", en: "Outside directors are supposed to serve as helpful, yet less biased, advisers on a firm’s board.", ref: "外部董事被认为是公司董事会中有益且更公正的顾问。",
      ai: { backbone: "主语 Outside directors、谓语 are supposed to serve、宾补 as helpful, yet less biased, advisers", structure: ["介词短语 as helpful, yet less biased, advisers：作主语补足语，说明应扮演的角色","介词短语 on a firm’s board：说明位置"], collocations: ["be supposed to do（理应做某事）","outside directors（外部董事）","less biased（偏见较少的）"] }},
    { num: "②", en: "Having made their wealth and their reputations elsewhere, they presumably have enough independence to disagree with the chief executive’s proposals.", ref: "他们已在别处名成利就，因此应拥有足够的独立性来质疑董事长的提案。",
      ai: { backbone: "主语 they、谓语 have、宾语 enough independence", structure: ["现在分词短语 Having made their wealth and their reputations elsewhere：作原因状语，说明独立性来源","不定式短语 to disagree with the chief executive’s proposals：作后置定语，修饰 independence"], collocations: ["make one’s wealth and reputation（积累财富和名声）","enough independence to do（有足够独立性去做）","disagree with（不同意）","the chief executive’s proposals（首席执行官的提议）"] }},
    { num: "③", en: "If the sky, and the share price is falling, outside directors should be able to give advice based on having weathered their own crises.", ref: "假若公司面临灭顶之灾，股票价格大跌，外部董事应能基于自身应付危机的经验向公司提出建议。",
      ai: { backbone: "主句：主语 outside directors、谓语 should be able to give、宾语 advice；条件状语从句 If the sky, and the share price is falling", structure: ["条件状语从句 If the sky, and the share price is falling：说明条件","过去分词短语 based on having weathered their own crises：作后置定语，修饰 advice","动名词短语 having weathered their own crises：作介词 on 的宾语"], collocations: ["share price（股价）","give advice（提供建议）","be based on（基于）","weather crises（安然度过危机）"] }}
    ]
  },
  {
    day: 117,
    type: "英二",
    source: "2011 Text 1",
    zh: "来自俄亥俄大学的研究者利用一个数据库（对外部董事）进行了研究，该数据库涵盖从 1989年到 2004 年 10000 多家公司和 64000 多名董事的信息。然后他们只是核查了有哪些在同一公司连任的留任董事。离开董事会最有可能的原因是年龄问题，因此研究者集中关注那些年龄在 70 岁以下“突然”离职的董事。他们发现，（董事）突然离职后，其所在公司随后需要重申盈利的可能性增加了近 20%。公司在联邦集体诉讼中被提及的可能性也随之增加，且公司股票也可能表现更糟。公司越大往往受的影响也越大。尽管研究表明“董事离职”与“公司随后糟糕表现”之间具有相关性，但这并不意味着这些董事总是在“跳离沉船”。他们通常是在“另谋高就”，离开风险较高的小公司而去往更稳定的大公司。",
    sentences: [
    { num: "①", en: "The researchers from Ohio University used a database that covered more than 10,000 firms and more than 64,000 different directors between 1989 and 2004.", ref: "来自俄亥俄大学的研究者利用一个数据库（对外部董事）进行了研究，该数据库涵盖从 1989年到 2004 年 10000 多家公司和 64000 多名董事的信息。",
      ai: { backbone: "主语 The researchers、谓语 used、宾语 a database", structure: ["介词短语 from Ohio University：作后置定语，修饰 researchers","定语从句 that covered more than 10,000 firms and more than 64,000 different directors：修饰 database","介词短语 between 1989 and 2004：说明时间范围"], collocations: ["cover...firms（涵盖……家公司）","different directors（不同的董事）"] }},
    { num: "②", en: "Then they simply checked which directors stayed from one proxy statement to the next.", ref: "然后他们只是核查了有哪些在同一公司连任的留任董事。",
      ai: { backbone: "主语 they、谓语 checked、宾语从句 which directors stayed from one proxy statement to the next", structure: ["副词 simply：作状语","宾语从句 which directors stayed：作 checked 的宾语","介词短语 from one proxy statement to the next：说明时间跨度"], collocations: ["proxy statement（委托投票说明书）","from...to...（从……到……）"] }},
    { num: "③", en: "The most likely reason for departing a board was age, so the researchers concentrated on those “surprise” disappearances by directors under the age of 70.", ref: "离开董事会最有可能的原因是年龄问题，因此研究者集中关注那些年龄在 70 岁以下“突然”离职的董事。",
      ai: { backbone: "并列句：句1 主语 The most likely reason、谓语 was、表语 age；句2 主语 the researchers、谓语 concentrated on、宾语 those “surprise” disappearances", structure: ["介词短语 for departing a board：作后置定语，修饰 reason","介词短语 by directors under the age of 70：作后置定语，修饰 disappearances","介词短语 under the age of 70：作后置定语，修饰 directors"], collocations: ["the most likely reason for（……最可能的原因）","depart a board（离开董事会）","concentrate on（专注于）","surprise disappearances（突然离职）","under the age of（在……岁以下）"] }},
    { num: "④", en: "They found that after a surprise departure, the probability that the company will subsequently have to restate earnings increases by nearly 20%.", ref: "他们发现，（董事）突然离职后，其所在公司随后需要重申盈利的可能性增加了近 20%。",
      ai: { backbone: "主句：主语 they、谓语 found、宾语从句 that the probability increases", structure: ["时间状语 after a surprise departure：说明时间","宾语从句 that the probability that the company will subsequently have to restate earnings increases by nearly 20%：作 found 的宾语","同位语从句 that the company will subsequently have to restate earnings：解释说明 the probability","介词短语 by nearly 20%：说明增加的幅度"], collocations: ["restate earnings（重述收益）","increase by（增加……）","subsequently（随后）"] }},
    { num: "⑤", en: "The likelihood of being named in a federal class-action lawsuit also increases, and the stock is likely to perform worse.", ref: "公司在联邦集体诉讼中被提及的可能性也随之增加，且公司股票也可能表现更糟。",
      ai: { backbone: "并列句：句1 主语 The likelihood、谓语 increases；句2 主语 the stock、谓语 is likely to perform worse", structure: ["介词短语 of being named in a federal class-action lawsuit：作后置定语，修饰 The likelihood","被动动名词 being named：作介词 of 的宾语","介词短语 in a federal class-action lawsuit：说明被点名的场合"], collocations: ["the likelihood of doing（做某事的可能性）","be named in（被列为……的一方）","a federal class-action lawsuit（联邦集体诉讼）","perform worse（表现更差）"] }},
    { num: "⑥", en: "The effect tended to be larger for larger firms.", ref: "公司越大往往受的影响也越大。",
      ai: { backbone: "主语 The effect、谓语 tended to be larger、状语 for larger firms", structure: ["介词短语 for larger firms：说明适用范围"], collocations: ["tend to be（往往是）","larger firms（规模较大的公司）"] }},
    { num: "⑦", en: "Although a correlation between them leaving and subsequent bad performance at the firm is suggestive, it does not mean that such directors are always jumping off a sinking ship.", ref: "尽管研究表明“董事离职”与“公司随后糟糕表现”之间具有相关性，但这并不意味着这些董事总是在“跳离沉船”。",
      ai: { backbone: "主句：主语 it、谓语 does not mean、宾语从句 that such directors are always jumping off a sinking ship；让步状语从句 Although a correlation is suggestive", structure: ["让步状语从句 Although a correlation between them leaving and subsequent bad performance at the firm is suggestive：表示让步","介词短语 between them leaving and subsequent bad performance：说明相关性的两端","宾语从句 that such directors are always jumping off a sinking ship：作 mean 的宾语"], collocations: ["a correlation between...and...（……与……之间的相关性）","bad performance（糟糕的表现）","jump off a sinking ship（逃离正在下沉的船，喻及时抽身）"] }},
    { num: "⑧", en: "Often they “trade up,” leaving riskier, smaller firms for larger and more stable firms.", ref: "他们通常是在“另谋高就”，离开风险较高的小公司而去往更稳定的大公司。",
      ai: { backbone: "主语 they、谓语 “trade up”、状语 often", structure: ["现在分词短语 leaving riskier, smaller firms for larger and more stable firms：作伴随状语，说明“跳槽升级”的方式","介词短语 for larger and more stable firms：说明跳往何处"], collocations: ["trade up（升级，跳槽到更好的）","riskier, smaller firms（风险更大、规模更小的公司）","more stable firms（更稳定的公司）"] }}
    ]
  },
  {
    day: 118,
    type: "英二",
    source: "2011 Text 1",
    zh: "但研究者认为，如果外部董事在坏消息爆发前就已离开公司，那么他们会更容易避免声誉受损——即便历史记录显示“错误行为出现时，董事们尚在其职”（依然如此）。那些想要在困难时期留住外部董事的公司可能需要采取激励措施。否则外部董事就会效仿西蒙斯女士，离开董事会，在校园重获欢迎。",
    sentences: [
    { num: "①", en: "But the researchers believe that outside directors have an easier time of avoiding a blow to their reputations if they leave a firm before bad news breaks, even if a review of history shows they were on the board at the time any wrongdoing occurred.", ref: "但研究者认为，如果外部董事在坏消息爆发前就已离开公司，那么他们会更容易避免声誉受损——即便历史记录显示“错误行为出现时，董事们尚在其职”（依然如此）。",
      ai: { backbone: "主句：主语 outside directors、谓语 have an easier time、状语 of avoiding a blow；条件状语从句 if they leave a firm", structure: ["介词短语 of avoiding a blow to their reputations：作后置定语，修饰 time","条件状语从句 if they leave a firm before bad news breaks：说明条件","时间状语从句 before bad news breaks：说明离职时机","让步状语从句 even if a review of history shows they were on the board：表示让步","宾语从句 they were on the board at the time any wrongdoing occurred：作 shows 的宾语"], collocations: ["have an easier time of doing（做某事更容易）","avoid a blow to（避免对……的打击）","one’s reputation（名声）","bad news breaks（坏消息传出）","wrongdoing（不法行为）"] }},
    { num: "②", en: "Firms who want to keep their outside directors through tough times may have to create incentives.", ref: "那些想要在困难时期留住外部董事的公司可能需要采取激励措施。",
      ai: { backbone: "主语 Firms、谓语 may have to create、宾语 incentives", structure: ["定语从句 who want to keep their outside directors through tough times：修饰 Firms","介词短语 through tough times：说明时段"], collocations: ["keep directors（留住董事）","through tough times（在艰难时期）","create incentives（建立激励机制）"] }},
    { num: "③", en: "Otherwise outside directors will follow the example of Ms. Simmons, once again very popular on campus.", ref: "否则外部董事就会效仿西蒙斯女士，离开董事会，在校园重获欢迎。",
      ai: { backbone: "主语 outside directors、谓语 will follow、宾语 the example of Ms. Simmons", structure: ["副词 Otherwise：作状语，表示“否则”","过去分词短语 once again very popular on campus：作后置定语，修饰 Ms. Simmons"], collocations: ["follow the example of（效仿……）","once again（再次）","popular on campus（在校园里受欢迎）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "blown.打击", word: "blow", meaning: "n.打击" },
      { raw: "reputationn.名誉，名声", word: "reputation", meaning: "n.名誉，名声" },
      { raw: "boardn.董事会，理事会", word: "board", meaning: "n.董事会，理事会" },
      { raw: "wrongdoingn.坏事，不道德的行为", word: "wrongdoing", meaning: "n.坏事，不道德的行为" },
      { raw: "outsidedirectors外部董事", word: "outsidedirectors外部董事", meaning: "" }
    ],
        split: "Buttheresearchersbelieve//thatoutsidedirectorshaveaneasiertime//ofavoiding ablow//totheirreputations//iftheyleaveafirm//beforebadnewsbreaks,//evenifa reviewofhistoryshows//(that)theywere//ontheboard//atthetimeanywrongdoing occurred.",
        grammar: ["主干：主+谓+宾语从句", "主干结构提炼：theresearchersbelievethat...", "if引导条件状语从句", "before引导时间状语从句", "evenif引导让步状语从句", "shows后省略连接词that，引导宾语从句", "atthetime(相当于when)引导时间状语从句"],
        ref: "但研究者认为，如果外部董事在坏消息爆发前就已离开公司，那么他们会更容易避免声誉受损---即便历史记录显示“错误行为出现时，董事们尚在其职”(依然如此)。"
      }
    ]
  },
  {
    day: 119,
    type: "英二",
    source: "2011 Text 2",
    zh: "报纸业的消亡（之势）到底遇到了什么情况？一年前，末日似乎近在咫尺。经济衰退差点将仅存的还未转至互联网的广告及读者彻底清除。像《旧金山纪事报》这类报纸已经着手记录自己的劫数了。美国联邦贸易委员会发起了一轮如何拯救报纸业的会谈。它们是否应该转型成公益企业？政府是否应该给予其补贴？委员会即将再次召开一场讨论会。但现在看来这些讨论似乎已经不合时宜了。",
    sentences: [
    { num: "①", en: "Whatever happened to the death of newspapers?", ref: "报纸业的消亡（之势）到底遇到了什么情况？",
      ai: { backbone: "主语 Whatever、谓语 happened、状语 to the death of newspapers", structure: ["疑问词 Whatever：作主语，表示“到底发生了什么事”","介词短语 to the death of newspapers：说明对象"], collocations: ["the death of newspapers（报纸的消亡）"] }},
    { num: "②", en: "A year ago the end seemed near.", ref: "一年前，末日似乎近在咫尺。",
      ai: { backbone: "主语 the end、谓语 seemed、表语 near", structure: ["时间状语 A year ago：说明时间"], collocations: ["a year ago（一年前）","the end seemed near（末日似乎临近）"] }},
    { num: "③", en: "The recession threatened to remove the advertising and readers that had not already fled to the Internet.", ref: "经济衰退差点将仅存的还未转至互联网的广告及读者彻底清除。",
      ai: { backbone: "主语 The recession、谓语 threatened to remove、宾语 the advertising and readers", structure: ["定语从句 that had not already fled to the Internet：修饰 the advertising and readers"], collocations: ["threaten to do（威胁要做）","flee to the Internet（流向互联网）"] }},
    { num: "④", en: "Newspapers like the San Francisco Chronicle were chronicling their own doom.", ref: "像《旧金山纪事报》这类报纸已经着手记录自己的劫数了。",
      ai: { backbone: "主语 Newspapers like the San Francisco Chronicle、谓语 were chronicling、宾语 their own doom", structure: ["介词短语 like the San Francisco Chronicle：举例说明报纸类型"], collocations: ["chronicle one’s own doom（记录自己的厄运）"] }},
    { num: "⑤", en: "America’s Federal Trade Commission launched a round of talks about how to save newspapers.", ref: "美国联邦贸易委员会发起了一轮如何拯救报纸业的会谈。",
      ai: { backbone: "主语 America’s Federal Trade Commission、谓语 launched、宾语 a round of talks", structure: ["介词短语 about how to save newspapers：作后置定语，说明会谈主题"], collocations: ["Federal Trade Commission（联邦贸易委员会）","a round of talks（一轮会谈）","save newspapers（拯救报纸）"] }},
    { num: "⑥", en: "Should they become charitable corporations?", ref: "它们是否应该转型成公益企业？",
      ai: { backbone: "主语 they、谓语 become、表语 charitable corporations（疑问句）", structure: ["助动词 Should 置于句首构成疑问句","表语 charitable corporations：说明是否应成为公益公司"], collocations: ["charitable corporations（公益公司）"] }},
    { num: "⑦", en: "Should the state subsidize them?", ref: "政府是否应该给予其补贴？",
      ai: { backbone: "主语 the state、谓语 subsidize、宾语 them（疑问句）", structure: ["助动词 Should 置于句首构成疑问句"], collocations: ["subsidize（补贴）"] }},
    { num: "⑧", en: "It will hold another meeting soon.", ref: "委员会即将再次召开一场讨论会。",
      ai: { backbone: "主语 It、谓语 will hold、宾语 another meeting", structure: ["时间状语 soon：说明时间"], collocations: ["hold a meeting（开会）"] }},
    { num: "⑨", en: "But the discussions now seem out of date.", ref: "但现在看来这些讨论似乎已经不合时宜了。",
      ai: { backbone: "主语 the discussions、谓语 seem、表语 out of date", structure: ["转折连词 But：表转折","副词 now：作时间状语","表语 out of date：说明讨论已过时"], collocations: ["seem out of date（似乎过时了）"] }}
    ]
  },
  {
    day: 120,
    type: "英二",
    source: "2011 Text 2",
    zh: "现在全球大多数地区几乎没有危机迹象。德国和巴西的报纸业已经摆脱了经济衰退。甚至连全球报纸业中处境最艰难的美国报纸业不仅也挺了过来，而且还基本恢复盈利。虽不及几年前通常 20%的利润空间，但毕竟是有钱可赚。（但）情况也不是太乐观。多家报社通过裁员来维持运营。据美国新闻编辑协会估算，2007年以来有 1.35 万个新闻编辑工作岗位消失了。读者付费更多却获得缩水的内容。一些报社甚至敢拒绝向边远郊区递送报纸。不过，这些孤注一掷的举措证明是对的，只是不幸的是，对于许多新闻工作者来说，他们可能遭到进一步的裁员。",
    sentences: [
    { num: "①", en: "In much of the world there is little sign of crisis.", ref: "现在全球大多数地区几乎没有危机迹象。",
      ai: { backbone: "There be 结构：主语 little sign of crisis、be 动词 is", structure: ["介词短语 In much of the world：作地点状语"], collocations: ["little sign of（……几乎没有迹象）","in much of the world（在世界大部分地区）"] }},
    { num: "②", en: "German and Brazilian papers have shrugged off the recession.", ref: "德国和巴西的报纸业已经摆脱了经济衰退。",
      ai: { backbone: "主语 German and Brazilian papers、谓语 have shrugged off、宾语 the recession", structure: ["副词短语 have shrugged off：表示已摆脱衰退影响"], collocations: ["shrug off（对……不以为然，摆脱）","the recession（经济衰退）"] }},
    { num: "③", en: "Even American newspapers, which inhabit the most troubled corner of the global industry, have not only survived but often returned to profit.", ref: "甚至连全球报纸业中处境最艰难的美国报纸业不仅也挺了过来，而且还基本恢复盈利。",
      ai: { backbone: "主句：主语 American newspapers、谓语 have not only survived but returned to profit", structure: ["非限制性定语从句 which inhabit the most troubled corner of the global industry：修饰 American newspapers","not only...but...结构：强调两个并列谓语"], collocations: ["inhabit the most troubled corner（处于最动荡的角落）","the global industry（全球行业）","not only...but...（不仅……而且……）","return to profit（恢复盈利）"] }},
    { num: "④", en: "Not the 20% profit margins that were routine a few years ago, but profit all the same.", ref: "虽不及几年前通常 20%的利润空间，但毕竟是有钱可赚。",
      ai: { backbone: "主语 Not the 20% profit margins、谓语 was（省略）；表语 profit all the same", structure: ["介词短语 that were routine a few years ago：作后置定语，修饰 profit margins","插入语 but profit all the same：表示“但终究是利润”"], collocations: ["profit margins（利润率）","be routine（司空见惯）","all the same（依然，仍然）"] }},
    { num: "⑤", en: "It has not been much fun.", ref: "（但）情况也不是太乐观。",
      ai: { backbone: "主语 It、谓语 has not been、表语 much fun", structure: ["代词 It 指代前文所述情况"], collocations: ["not much fun（没什么乐趣）"] }},
    { num: "⑥", en: "Many papers stayed afloat by pushing journalists overboard.", ref: "多家报社通过裁员来维持运营。",
      ai: { backbone: "主语 Many papers、谓语 stayed afloat、状语 by pushing journalists overboard", structure: ["介词短语 by pushing journalists overboard：作方式状语，说明维持运转的手段"], collocations: ["stay afloat（维持运转，不倒闭）","push journalists overboard（把记者赶下船，即裁员）"] }},
    { num: "⑦", en: "The American Society of News Editors reckons that 13,500 newsroom jobs have gone since 2007.", ref: "据美国新闻编辑协会估算，2007年以来有 1.35 万个新闻编辑工作岗位消失了。",
      ai: { backbone: "主语 The American Society of News Editors、谓语 reckons、宾语从句 that 13,500 newsroom jobs have gone", structure: ["宾语从句 that 13,500 newsroom jobs have gone since 2007：作 reckons 的宾语","时间状语 since 2007：说明时间起点"], collocations: ["newsroom jobs（编辑部岗位）","since 2007（自2007年以来）"] }},
    { num: "⑧", en: "Readers are paying more for slimmer products.", ref: "读者付费更多却获得缩水的内容。",
      ai: { backbone: "主语 Readers、谓语 are paying、状语 more、介词短语 for slimmer products", structure: ["介词短语 for slimmer products：说明付费对象"], collocations: ["pay more for（为……支付更多）","slimmer products（更薄的报纸）"] }},
    { num: "⑨", en: "Some papers even had the nerve to refuse delivery to distant suburbs.", ref: "一些报社甚至敢拒绝向边远郊区递送报纸。",
      ai: { backbone: "主语 Some papers、谓语 had、宾语 the nerve、不定式 to refuse delivery", structure: ["介词短语 even：作状语，加强语气","不定式短语 to refuse delivery to distant suburbs：作后置定语，修饰 nerve"], collocations: ["have the nerve to do（竟敢做某事）","refuse delivery（拒绝投递）","distant suburbs（偏远的郊区）"] }},
    { num: "⑩", en: "Yet these desperate measures have proved the right ones and, sadly for many journalists, they can be pushed further.", ref: "不过，这些孤注一掷的举措证明是对的，只是不幸的是，对于许多新闻工作者来说，他们可能遭到进一步的裁员。",
      ai: { backbone: "主句：主语 these desperate measures、谓语 have proved、表语 the right ones；并列句 they can be pushed further", structure: ["转折连词 Yet：表转折","副词 sadly for many journalists：作评注性状语","介词短语 for many journalists：说明对谁而言可悲"], collocations: ["desperate measures（孤注一掷的措施）","prove the right ones（被证明是正确的举措）","push further（进一步推进）"] }}
    ]
  },
  {
    day: 121,
    type: "英二",
    source: "2011 Text 2",
    zh: "随着来自读者和广告商的收益比例更加健康合理，报纸业日趋平衡。长期以来，美国报纸业对广告过度依赖。经济合作与发展组织（OECD）称，2008 年美国报纸业高达 87%的收益来自广告。（而）在日本这一比例为 35%。毫无疑问，日本报纸业要稳定得多。",
    sentences: [
    { num: "①", en: "Newspapers are becoming more balanced businesses, with a healthier mix of revenues from readers and advertisers.", ref: "随着来自读者和广告商的收益比例更加健康合理，报纸业日趋平衡。",
      ai: { backbone: "主语 Newspapers、谓语 are becoming、表语 more balanced businesses", structure: ["介词短语 with a healthier mix of revenues from readers and advertisers：作伴随状语，说明收入结构"], collocations: ["more balanced businesses（更均衡的业务）","a healthier mix of（更健康的组合）","revenues from readers and advertisers（来自读者和广告商的收入）"] }},
    { num: "②", en: "American papers have long been highly unusual in their reliance on ads.", ref: "长期以来，美国报纸业对广告过度依赖。",
      ai: { backbone: "主语 American papers、谓语 have been unusual、状语 in their reliance on ads", structure: ["时间状语 long：作状语，表示“长期以来”","副词 highly：作状语，修饰 unusual","介词短语 in their reliance on ads：说明在依赖广告方面的异常"], collocations: ["be highly unusual in（在……方面极不寻常）","reliance on ads（对广告的依赖）"] }},
    { num: "③", en: "Fully 87% of their revenues came from advertising in 2008, according to the Organization for Economic Cooperation & Development (OECD).", ref: "经济合作与发展组织（OECD）称，2008 年美国报纸业高达 87%的收益来自广告。",
      ai: { backbone: "主语 87% of their revenues、谓语 came from、宾语 advertising；时间状语 in 2008", structure: ["副词 Fully：作状语，表示“足足有”","介词短语 according to the Organization for Economic Cooperation & Development (OECD)：作状语，说明信息来源"], collocations: ["come from advertising（来自广告）","according to（根据）","Organization for Economic Cooperation & Development（经济合作与发展组织）"] }},
    { num: "④", en: "In Japan the proportion is 35%.", ref: "（而）在日本这一比例为 35%。",
      ai: { backbone: "主语 the proportion、谓语 is、表语 35%；地点状语 In Japan", structure: ["介词短语 In Japan：作地点状语"], collocations: ["the proportion（比例）"] }},
    { num: "⑤", en: "Not surprisingly, Japanese newspapers are much more stable.", ref: "毫无疑问，日本报纸业要稳定得多。",
      ai: { backbone: "主语 Japanese newspapers、谓语 are、表语 much more stable", structure: ["评注性状语 Not surprisingly：作状语，表示“毫不奇怪”","比较级 much more stable：表示稳定得多"], collocations: ["not surprisingly（毫不奇怪）","much more stable（稳定得多）"] }}
    ]
  },
  {
    day: 122,
    type: "英二",
    source: "2011 Text 2",
    zh: "这场席卷整个新闻编辑部的旋风伤及每个人，但大部分损失集中于报纸内容最缺乏特色的板块。汽车和电影评论员消失了。科学和大众商业记者也未能留下。驻外办事处遭到无情撤销。因此，现在报纸更加不完整。但如今，完整性已经不再是报纸业的优点了。",
    sentences: [
    { num: "①", en: "The whirlwind that swept through newsrooms harmed everybody, but much of the damage has been concentrated in areas where newspapers are least distinctive.", ref: "这场席卷整个新闻编辑部的旋风伤及每个人，但大部分损失集中于报纸内容最缺乏特色的板块。",
      ai: { backbone: "主句：主语 the whirlwind、谓语 harmed、宾语 everybody；定语从句 that swept through newsrooms", structure: ["定语从句 that swept through newsrooms：修饰 The whirlwind","转折连词 but：表转折","并列分句 much of the damage has been concentrated in areas：说明另一面","介词短语 in areas：说明损害集中的领域","定语从句 where newspapers are least distinctive：修饰 areas"], collocations: ["sweep through（席卷）","concentrate in（集中于）","least distinctive（最缺乏特色的）"] }},
    { num: "②", en: "Car and film reviewers have gone.", ref: "汽车和电影评论员消失了。",
      ai: { backbone: "主语 Car and film reviewers、谓语 have gone", structure: ["现在完成时 have gone：表示已消失"], collocations: ["car and film reviewers（汽车和电影评论员）"] }},
    { num: "③", en: "So have science and general business reporters.", ref: "科学和大众商业记者也未能留下。",
      ai: { backbone: "主语 science and general business reporters、谓语 have gone（倒装：So have 结构）", structure: ["倒装结构 So have...：表示“……也是如此”，承接上句"], collocations: ["science and general business reporters（科学和普通商业记者）","so have（……也是如此）"] }},
    { num: "④", en: "Foreign bureaus have been savagely cut off.", ref: "驻外办事处遭到无情撤销。",
      ai: { backbone: "主语 Foreign bureaus、谓语 have been savagely cut off", structure: ["副词 savagely：作状语，表示“残酷地”","被动语态 have been cut off：表示被切断"], collocations: ["foreign bureaus（驻外分社）","cut off（切断，砍掉）"] }},
    { num: "⑤", en: "Newspapers are less complete as a result.", ref: "因此，现在报纸更加不完整。",
      ai: { backbone: "主语 Newspapers、谓语 are、表语 less complete", structure: ["介词短语 as a result：作状语，表示“结果”"], collocations: ["as a result（结果）","be less complete（更不完整）"] }},
    { num: "⑥", en: "But completeness is no longer a virtue in the newspaper business.", ref: "但如今，完整性已经不再是报纸业的优点了。",
      ai: { backbone: "主语 completeness、谓语 is、表语 no longer a virtue", structure: ["介词短语 in the newspaper business：说明领域","转折连词 But：表转折"], collocations: ["no longer（不再）","a virtue（一种美德）","the newspaper business（报业）"] }}
    ],
    analysis: [
      {
        sentNum: "①",
        vocab: [
      { raw: "whirlwindn.旋风", word: "whirlwind", meaning: "n.旋风" },
      { raw: "newsroomsn.新闻编辑部", word: "newsrooms", meaning: "n.新闻编辑部" },
      { raw: "concentratev.使集中，聚集", word: "concentrate", meaning: "v.使集中，聚集" },
      { raw: "distinctiveadj.独特的，与众不同的", word: "distinctive", meaning: "adj.独特的，与众不同的" },
      { raw: "sweepthrough席卷，横扫", word: "sweepthrough席卷，横扫", meaning: "" }
    ],
        split: "Thewhirlwind//thatsweptthroughnewsroomsharmedeverybody,//butmuchof thedamagehasbeenconcentratedinareas//wherenewspapersareleastdistinctive.",
        grammar: ["主干1：主+谓+宾主干2：主+谓", "but并列两个分句", "that引导定语从句（修饰whirlwind）", "where引导定语从句（修饰areas）"],
        ref: "这场席卷整个新闻编辑部的旋风伤及每个人，但大部分损失集中于报纸内容最缺乏特色的板块。"
      }
    ]
  },
  {
    day: 123,
    type: "英二",
    source: "2011 Text 3",
    zh: "我们往往将二战结束后的几十年看作一个繁荣与增长的时代，数以百万计的士兵们返回家乡;他们在《退伍军人权利法案》的帮助下去上大学；在婚姻登记处排队登记结婚。但是说到住宅，那却是一个“少真的可以是多”成为常识和信念的时代。在大萧条和战争时期，美国人学会了节约生活，这种克制连同战后对未来生活的信心，使得小而高效的住宅成为绝对的时髦。",
    sentences: [
    { num: "①", en: "We tend to think of the decades immediately following World War II as a time of prosperity and growth, with soldiers returning home by the millions, going off to college on the G. I. Bill and lining up at the marriage bureaus.", ref: "我们往往将二战结束后的几十年看作一个繁荣与增长的时代，数以百万计的士兵们返回家乡;他们在《退伍军人权利法案》的帮助下去上大学；在婚姻登记处排队登记结婚。",
      ai: { backbone: "主语 We、谓语 tend to think of、宾语 the decades、宾补 as a time of prosperity and growth", structure: ["时间状语 immediately following World War II：作后置定语，修饰 the decades","现在分词短语 following World War II：作后置定语","介词短语 with soldiers returning home by the millions：作伴随状语","现在分词短语 returning home by the millions：作宾语补足语","并列现在分词短语 going off to college on the G. I. Bill：与 returning 并列","并列现在分词短语 and lining up at the marriage bureaus：与前面并列"], collocations: ["tend to think of...as（往往把……看作）","prosperity and growth（繁荣与增长）","by the millions（成千上万地）","the G. I. Bill（《退伍军人权利法案》）","line up at the marriage bureaus（在婚姻登记处排队）"] }},
    { num: "②", en: "But when it came to their houses, it was a time of common sense and a belief that less could truly be more.", ref: "但是说到住宅，那却是一个“少真的可以是多”成为常识和信念的时代。",
      ai: { backbone: "主句：主语 it、谓语 was、表语 a time of common sense and a belief；时间状语从句 when it came to their houses", structure: ["转折连词 But：表转折","时间状语从句 when it came to their houses：表示“当谈到他们的住房时”","同位语从句 that less could truly be more：解释说明 a belief"], collocations: ["when it comes to（当谈到……时）","common sense（常识）","less could truly be more（少即是多）"] }},
    { num: "③", en: "During the Depression and the war, Americans had learned to live with less, and that restraint, in combination with the postwar confidence in the future, made small, efficient housing positively stylish.", ref: "在大萧条和战争时期，美国人学会了节约生活，这种克制连同战后对未来生活的信心，使得小而高效的住宅成为绝对的时髦。",
      ai: { backbone: "并列句：句1 主语 Americans、谓语 had learned to live、状语 with less；句2 主语 that restraint、谓语 made、宾语 small, efficient housing、宾补 positively stylish", structure: ["时间状语 During the Depression and the war：说明时间","介词短语 with less：说明生活方式","介词短语 in combination with the postwar confidence in the future：说明与什么结合","副词 positively：作状语，表示“确实”"], collocations: ["the Depression（大萧条）","live with less（节俭生活）","in combination with（与……结合）","postwar confidence（战后的信心）","small, efficient housing（小而高效的住房）"] }}
    ]
  },
  {
    day: 124,
    type: "英二",
    source: "2011 Text 3",
    zh: "经济状况只是这种高效生活方式的一个刺激因素。“少即是多”这句话实际上是首先由一位名叫路德维希·密斯·凡德罗的德国建筑家推广开来的，像其他与包豪斯建筑学院相关的设计师一样，他在二战之前移民到美国，并曾在美国多个建筑学院任职。这些设计师们来到美国，对美国建筑业的发展施加了巨大的影响，但是其中影响最大的，还是要数密斯。",
    sentences: [
    { num: "①", en: "Economic condition was only a stimulus for the trend toward efficient living.", ref: "经济状况只是这种高效生活方式的一个刺激因素。",
      ai: { backbone: "主语 Economic condition、谓语 was、表语 only a stimulus", structure: ["介词短语 for the trend toward efficient living：作后置定语，修饰 stimulus"], collocations: ["economic condition（经济状况）","a stimulus for（对……的刺激因素）","the trend toward（向……发展的趋势）","efficient living（高效节能的生活方式）"] }},
    { num: "②", en: "The phrase “less is more” was actually first popularized by a German, the architect Ludwig Mies van der Rohe, who like other people associated with the Bauhaus, a school of design, emigrated to the United States before World War II and took up posts at American architecture schools.", ref: "“少即是多”这句话实际上是首先由一位名叫路德维希·密斯·凡德罗的德国建筑家推广开来的，像其他与包豪斯建筑学院相关的设计师一样，他在二战之前移民到美国，并曾在美国多个建筑学院任职。",
      ai: { backbone: "主语 The phrase “less is more”、谓语 was popularized；状语 first by a German", structure: ["副词 actually：作状语，加强语气","名词短语 the architect Ludwig Mies van der Rohe：作 a German 的同位语，说明具体人物","非限制性定语从句 who, like other people associated with the Bauhaus, emigrated to the United States before World War II and took up posts：修饰 Mies van der Rohe","介词短语 like other people：作插入语","过去分词短语 associated with the Bauhaus, a school of design：作后置定语，修饰 other people","介词短语 before World War II：说明时间","介词短语 at American architecture schools：说明任职地点"], collocations: ["popularize（推广）","less is more（少即是多）","be associated with（与……相关）","emigrate to（移民到）","take up posts at（在……任职）","architecture schools（建筑学院）"] }},
    { num: "③", en: "These designers came to exert enormous influence on the course of American architecture, but none more so than Mies.", ref: "这些设计师们来到美国，对美国建筑业的发展施加了巨大的影响，但是其中影响最大的，还是要数密斯。",
      ai: { backbone: "主句：主语 These designers、谓语 came to exert、宾语 enormous influence；并列句 but none more so than Mies", structure: ["介词短语 on the course of American architecture：说明影响对象","转折连词 but：表转折","并列分句 none more so than Mies：省略了前文的 exert influence，表示“没有人比密斯影响更大”"], collocations: ["exert influence on（对……产生影响）","the course of（……的进程）","more so than（比……更甚）"] }}
    ]
  },
  {
    day: 125,
    type: "英二",
    source: "2011 Text 3",
    zh: "密斯的口头禅意思是，简约的装饰，经过适当的安排，会产生比繁复的装饰更强的冲击力。他认为，优雅并非来自于繁多。和其他的现代建筑师一样，他使用金属、玻璃和复合板，这些我们今天习以为常的材料，在 20 世纪 40 年代却是一种对未来的象征。密斯使用的精致的呈现方式，掩盖了他所设计的空间实际上是小而精，而非大而空的事实。例如，密斯建在芝加哥湖滨大道上那些优雅塔楼中的公寓，跟它们坐落在芝加哥黄金海岸上的年代更久远的邻居相比，面积更小，只有两个卧室,面积不到 1000 平方英尺。但是它们很受欢迎，因为这些公寓有着通透的玻璃墙，可以观看优美风景，建筑细节优雅，比例和谐，这些都是当时风靡的抽象艺术在建筑上的对应物。",
    sentences: [
    { num: "①", en: "Mies’s signature phrase means that less decoration, properly organized, has more impact than a lot.", ref: "密斯的口头禅意思是，简约的装饰，经过适当的安排，会产生比繁复的装饰更强的冲击力。",
      ai: { backbone: "主语 Mies’s signature phrase、谓语 means、宾语从句 that less decoration, properly organized, has more impact than a lot", structure: ["宾语从句 that less decoration, properly organized, has more impact than a lot：作 means 的宾语","过去分词短语 properly organized：作插入语，说明“若组织得当”","比较状语 than a lot：说明比较对象"], collocations: ["signature phrase（标志性口号）","properly organized（组织得当的）","have more impact（更有影响力）"] }},
    { num: "②", en: "Elegance, he believed, did not derive from abundance.", ref: "他认为，优雅并非来自于繁多。",
      ai: { backbone: "主语 Elegance、谓语 did not derive、状语 from abundance", structure: ["插入语 he believed：作插入成分","介词短语 from abundance：与 derive 搭配"], collocations: ["derive from（来源于）","abundance（丰盛，丰富）"] }},
    { num: "③", en: "Like other modern architects, he employed metal, glass and laminated wood — materials that we take for granted today but that in the 1940s symbolized the future.", ref: "和其他的现代建筑师一样，他使用金属、玻璃和复合板，这些我们今天习以为常的材料，在 20 世纪 40 年代却是一种对未来的象征。",
      ai: { backbone: "主句：主语 he、谓语 employed、宾语 metal, glass and laminated wood", structure: ["介词短语 Like other modern architects：作状语，说明与他人类似","名词短语 materials：作 metal, glass and laminated wood 的同位语","定语从句 that we take for granted today：修饰 materials","并列定语从句 but that in the 1940s symbolized the future：与前面的 that 从句并列","介词短语 in the 1940s：说明时间"], collocations: ["modern architects（现代建筑师）","laminated wood（层压木板）","take for granted（习以为常，想当然）","symbolize the future（象征未来）"] }},
    { num: "④", en: "Mies’s sophisticated presentation masked the fact that the spaces he designed were small and efficient, rather than big and often empty.", ref: "密斯使用的精致的呈现方式，掩盖了他所设计的空间实际上是小而精，而非大而空的事实。",
      ai: { backbone: "主语 Mies’s sophisticated presentation、谓语 masked、宾语 the fact", structure: ["同位语从句 that the spaces he designed were small and efficient, rather than big and often empty：解释说明 the fact","定语从句 he designed：修饰 the spaces（省略了关系代词 that）","介词短语 rather than big and often empty：作比较状语"], collocations: ["sophisticated presentation（精心呈现）","mask the fact（掩盖事实）","small and efficient（小巧而高效）"] }},
    { num: "⑤", en: "The apartments in the elegant towers Mies built on Chicago’s Lake Shore Drive, for example, were smaller — two-bedroom units under 1,000 square feet — than those in their older neighbors along the city’s Gold Coast.", ref: "例如，密斯建在芝加哥湖滨大道上那些优雅塔楼中的公寓，跟它们坐落在芝加哥黄金海岸上的年代更久远的邻居相比，面积更小，只有两个卧室,面积不到 1000 平方英尺。",
      ai: { backbone: "主语 The apartments、谓语 were、表语 smaller；地点状语 in the elegant towers", structure: ["定语从句 Mies built on Chicago’s Lake Shore Drive：修饰 towers（省略了关系代词 that）","插入语 for example：举例说明","破折号间的 two-bedroom units under 1,000 square feet：作 smaller 的补充说明","比较状语 than those in their older neighbors along the city’s Gold Coast：说明比较对象","介词短语 along the city’s Gold Coast：说明位置"], collocations: ["two-bedroom units（两居室单元）","under 1,000 square feet（不足1000平方英尺）","older neighbors（更老的邻居楼）","the Gold Coast（黄金海岸街区）"] }},
    { num: "⑥", en: "But they were popular because of their airy glass walls, the views they afforded and the elegance of the buildings’ details and proportions, the architectural equivalent of the abstract art so popular at the time.", ref: "但是它们很受欢迎，因为这些公寓有着通透的玻璃墙，可以观看优美风景，建筑细节优雅，比例和谐，这些都是当时风靡的抽象艺术在建筑上的对应物。",
      ai: { backbone: "主句：主语 they、谓语 were popular、原因状语 because of their airy glass walls, the views they afforded and the elegance", structure: ["转折连词 But：表转折","介词短语 because of...：说明受欢迎的原因","定语从句 they afforded：修饰 the views（省略了关系代词 that）","介词短语 of the buildings’ details and proportions：作后置定语，修饰 elegance","名词短语 the architectural equivalent of the abstract art：作同位语，说明这种优雅在建筑上的对应物","过去分词短语 so popular at the time：作后置定语，修饰 abstract art"], collocations: ["airy glass walls（通透的玻璃墙）","details and proportions（细节与比例）","the architectural equivalent of（……在建筑上的对应物）","abstract art（抽象艺术）"] }}
    ],
    analysis: [
      {
        sentNum: "⑥",
        vocab: [
      { raw: "airyadj.空气的，通风的", word: "airy", meaning: "adj.空气的，通风的" },
      { raw: "affordv.提供", word: "afford", meaning: "v.提供" },
      { raw: "elegancen.优雅，雅致", word: "elegance", meaning: "n.优雅，雅致" },
      { raw: "proportionn.比例", word: "proportion", meaning: "n.比例" },
      { raw: "equivalentn.对等的人或物", word: "equivalent", meaning: "n.对等的人或物" },
      { raw: "abstractart抽象艺术", word: "abstractart抽象艺术", meaning: "" }
    ],
        split: "Buttheywerepopular//becauseoftheirairyglasswalls,//theviews//(that)they afforded//andtheeleganceofthebuildings’detailsandproportions,//the architecturalequivalent//oftheabstractart//sopopularatthetime.",
        grammar: ["主干：主+系+表", "句子结构提炼：theywerepopularbecauseofA,BandC,D", "“becauseof...proportions”为原因状语", "第1个and并列三个名词短语（glasswalls/views/elegance）", "第2个and并列details和proportions", "views后省略连接词that，引导定语从句（修饰views）", "“thearchitecturalequivalent...time”为同位语，解释这些建筑物的特征"],
        ref: "但是它们很受欢迎，因其通透的玻璃墙、所提供的视野、以及建筑细节与比例的优雅感，这些建筑特征相当于当时盛行的抽象艺术。"
      }
    ]
  },
  {
    day: 126,
    type: "英二",
    source: "2011 Text 3",
    zh: "“简约”浪潮并不完全是舶来品。20 世纪 30 年代，弗兰克·劳埃德·赖特开始建造不太大的、更为简洁的住宅，这些住宅通常面积在 1200 平方英尺，而不像他自己在 19 世纪 90 年代的和 20 世纪初设计的面积铺张的二层住宅。由加州《艺术与建筑》杂志委托有才华的现代建筑师，于 1945 到 1962 年间建造的“案例研究住宅”，更是另一股在美国本土成长起来的，对“少即是多”浪潮产生影响的力量。审美效果来自于自然风光、新的材料,以及直观明了的细节设计。在罗夫·雷普森的案例研究住宅中,他可能错误预测了机械革命对日常生活可能产生的影响--尽管大多数美国家庭最终都拥有了干衣机，但很少有能拥有直升机的--但他认为自给自足既是可取的，也是必然的，这一信念却得到了广泛传播。",
    sentences: [
    { num: "①", en: "The trend toward “less” was not entirely foreign.", ref: "“简约”浪潮并不完全是舶来品。",
      ai: { backbone: "主语 The trend toward “less”、谓语 was、表语 not entirely foreign", structure: ["介词短语 toward “less”：作后置定语，修饰 trend","副词 entirely：作状语，修饰 foreign"], collocations: ["be entirely foreign（完全外来的）"] }},
    { num: "②", en: "In the 1930s Frank Lloyd Wright started building more modest and efficient houses — usually around 1,200 square feet — than the spreading two-story ones he had designed in the 1890s and the early 20th century.", ref: "20 世纪 30 年代，弗兰克·劳埃德·赖特开始建造不太大的、更为简洁的住宅，这些住宅通常面积在 1200 平方英尺，而不像他自己在 19 世纪 90 年代的和 20 世纪初设计的面积铺张的二层住宅。",
      ai: { backbone: "主语 Frank Lloyd Wright、谓语 started building、宾语 more modest and efficient houses", structure: ["时间状语 In the 1930s：说明时间","破折号间的 usually around 1,200 square feet：补充说明面积","比较状语 than the spreading two-story ones：说明比较对象","定语从句 he had designed in the 1890s and the early 20th century：修饰 ones（省略了关系代词 that）"], collocations: ["modest and efficient houses（朴素而高效的住宅）","spreading two-story ones（占地大的两层住宅）"] }},
    { num: "③", en: "The “Case Study Houses” commissioned from talented modern architects by California Arts & Architecture magazine between 1945 and 1962 were yet another homegrown influence on the “less is more” trend.", ref: "由加州《艺术与建筑》杂志委托有才华的现代建筑师，于 1945 到 1962 年间建造的“案例研究住宅”，更是另一股在美国本土成长起来的，对“少即是多”浪潮产生影响的力量。",
      ai: { backbone: "主语 The “Case Study Houses”、谓语 were、表语 yet another homegrown influence", structure: ["过去分词短语 commissioned from talented modern architects：作后置定语，修饰 The “Case Study Houses”","介词短语 by California Arts & Architecture magazine：引出委托方","介词短语 between 1945 and 1962：说明时间范围","介词短语 on the “less is more” trend：说明影响对象"], collocations: ["Case Study Houses（案例研究住宅）","commission from（向……委托）","talented modern architects（有才华的现代建筑师）","homegrown influence（本土的影响）"] }},
    { num: "④", en: "Aesthetic effect came from the landscape, new materials and forthright detailing.", ref: "审美效果来自于自然风光、新的材料,以及直观明了的细节设计。",
      ai: { backbone: "主语 Aesthetic effect、谓语 came from、宾语 the landscape, new materials and forthright detailing", structure: ["介词短语 from the landscape, new materials and forthright detailing：与 come 搭配，说明来源"], collocations: ["aesthetic effect（美学效果）","new materials（新材料）","forthright detailing（直白的细节处理）"] }},
    { num: "⑤", en: "In his Case Study House, Ralph Rapson may have mispredicted just how the mechanical revolution would impact everyday life — few American families acquired helicopters, though most eventually got clothes dryers — but his belief that self-sufficiency was both desirable and inevitable was widely shared.", ref: "在罗夫·雷普森的案例研究住宅中,他可能错误预测了机械革命对日常生活可能产生的影响--尽管大多数美国家庭最终都拥有了干衣机，但很少有能拥有直升机的--但他认为自给自足既是可取的，也是必然的，这一信念却得到了广泛传播。",
      ai: { backbone: "主句：主语 Ralph Rapson、谓语 may have mispredicted、宾语 how the mechanical revolution would impact everyday life；转折并列句 but his belief was widely shared", structure: ["介词短语 In his Case Study House：说明场合","宾语从句 just how the mechanical revolution would impact everyday life：作 mispredicted 的宾语","破折号间的插入说明 few American families acquired helicopters, though most eventually got clothes dryers：举例说明误判","转折连词 but：表转折","同位语从句 that self-sufficiency was both desirable and inevitable：解释说明 his belief"], collocations: ["mispredict（错误预测）","the mechanical revolution（机械革命）","impact everyday life（影响日常生活）","clothes dryers（烘干机）","self-sufficiency（自给自足）","be widely shared（被广泛认同）"] }}
    ]
  },
  {
    day: 127,
    type: "英二",
    source: "2011 Text 4",
    zh: "欧盟还能成功走下去吗？如果不久前这么问:会让人觉得奇怪。可现在，即使是该项目（欧盟计划）最强有力的支持者都在议论整个大陆面临的百慕大三角”债务、人口下降以及增长趋缓。除了那些长期性问题以外，欧盟的经济核心区，即使用单一货币的 16 个成员国，还面临着一场严重的危机。市场已不再相信欧元区各经济体，无论强弱，会由于共用单一货币这一原则——让缺乏竞争力的成员国无法采取货币贬值这一权宜之计——而最终走向联合。",
    sentences: [
    { num: "①", en: "Will the European Union make it?", ref: "欧盟还能成功走下去吗？",
      ai: { backbone: "主语 the European Union、谓语 make、宾语 it（疑问句）", structure: ["助动词 Will 置于句首构成疑问句","代词 it 指代“成功/坚持下去”"], collocations: ["make it（成功，挺过去）"] }},
    { num: "②", en: "The question would have sounded strange not long ago.", ref: "如果不久前这么问:会让人觉得奇怪。",
      ai: { backbone: "主语 The question、谓语 would have sounded、表语 strange", structure: ["时间状语 not long ago：说明时间","虚拟语气 would have sounded：表示过去本会显得奇怪"], collocations: ["not long ago（不久前）","sound strange（听起来奇怪）"] }},
    { num: "③", en: "Now even the project’s greatest cheerleaders talk of a continent facing a “Bermuda triangle” of debt, population decline and lower growth.", ref: "可现在，即使是该项目（欧盟计划）最强有力的支持者都在议论整个大陆面临的百慕大三角”债务、人口下降以及增长趋缓。",
      ai: { backbone: "主语 the project’s greatest cheerleaders、谓语 talk of、宾语 a continent facing a “Bermuda triangle”", structure: ["时间状语 Now：说明时间","介词短语 even：加强语气","现在分词短语 facing a “Bermuda triangle” of debt, population decline and lower growth：作后置定语，修饰 continent","介词短语 of debt, population decline and lower growth：说明百慕大三角所指的内容"], collocations: ["cheerleaders（支持者，摇旗呐喊者）","a “Bermuda triangle”（“百慕大三角”，喻困境）","population decline（人口下降）"] }},
    { num: "④", en: "As well as those chronic problems, the EU faces an acute crisis in its economic core, the 16 countries that use the single currency.", ref: "除了那些长期性问题以外，欧盟的经济核心区，即使用单一货币的 16 个成员国，还面临着一场严重的危机。",
      ai: { backbone: "主句：主语 the EU、谓语 faces、宾语 an acute crisis；介词短语 in its economic core", structure: ["介词短语 As well as those chronic problems：作状语，表示“除了……之外”","介词短语 in its economic core：说明危机所在","名词短语 the 16 countries that use the single currency：作 economic core 的同位语","定语从句 that use the single currency：修饰 countries"], collocations: ["as well as（以及，除了）","chronic problems（长期性问题）","an acute crisis（严重的危机）","economic core（经济核心）","the single currency（单一货币）"] }},
    { num: "⑤", en: "Markets have lost faith that the euro zone’s economies, weaker or stronger, will one day converge thanks to the discipline of sharing a single currency, which denies uncompetitive members the quick fix of devaluation.", ref: "市场已不再相信欧元区各经济体，无论强弱，会由于共用单一货币这一原则——让缺乏竞争力的成员国无法采取货币贬值这一权宜之计——而最终走向联合。",
      ai: { backbone: "主语 Markets、谓语 have lost、宾语 faith；同位语从句 that the euro zone’s economies will one day converge", structure: ["同位语从句 that the euro zone’s economies, weaker or stronger, will one day converge thanks to the discipline of sharing a single currency：解释说明 faith 的内容","插入语 weaker or stronger：补充说明各类经济体","介词短语 thanks to the discipline of sharing a single currency：说明原因","非限制性定语从句 which denies uncompetitive members the quick fix of devaluation：修饰 a single currency"], collocations: ["lose faith that（对……失去信心）","the euro zone（欧元区）","converge（趋同，趋近）","thanks to（多亏，由于）","uncompetitive members（缺乏竞争力的成员）","the quick fix of devaluation（货币贬值的快速解决手段）"] }}
    ]
  },
  {
    day: 128,
    type: "英二",
    source: "2011 Text 4",
    zh: "然而关于如何使欧洲单一货币免于解体的讨论陷入了僵局。陷入僵局的原因在于，欧元区两大主导国家，法国和德国，在“欧元区内部需要加强统一”上观点一致，但在“统一内容”上却存在分歧。德国认为若想拯救欧元，必须在借贷支出以及竞争力等方面制定更加严格的准则，同时对违规的政府施以准自动制裁。这些制裁可以包括威胁冻结欧盟对较贫困地区及欧盟巨型项目的投资，甚至包含暂停一国在欧盟部长理事会中的投票权。德国坚持认为经济协作应该包含欧盟俱乐部的所有 27 国成员，在它们当中，支持自由市场自由主义和从严的经济政策占微弱多数；（不过）单从内部核心来看，德国担心，微弱多数会支持法国的干涉。",
    sentences: [
    { num: "①", en: "Yet the debate about how to save Europe’s single currency from disintegration is stuck.", ref: "然而关于如何使欧洲单一货币免于解体的讨论陷入了僵局。",
      ai: { backbone: "主语 the debate、谓语 is stuck；介词短语 about how to save Europe’s single currency from disintegration", structure: ["介词短语 about how to save Europe’s single currency from disintegration：作后置定语，修饰 debate","介词短语 from disintegration：与 save 搭配"], collocations: ["be stuck（陷入僵局）","save...from disintegration（使……免于解体）","single currency（单一货币）"] }},
    { num: "②", en: "It is stuck because the euro zone’s dominant powers, France and Germany, agree on the need for greater harmonization within the euro zone, but disagree about what to harmonize.", ref: "陷入僵局的原因在于，欧元区两大主导国家，法国和德国，在“欧元区内部需要加强统一”上观点一致，但在“统一内容”上却存在分歧。",
      ai: { backbone: "主句：主语 It、谓语 is stuck；原因状语从句 because the euro zone’s dominant powers agree on the need", structure: ["原因状语从句 because the euro zone’s dominant powers, France and Germany, agree on the need for greater harmonization：说明原因","插入语 France and Germany：说明 dominant powers 所指","介词短语 for greater harmonization：说明需要的内容","转折并列分句 but disagree about what to harmonize：说明分歧所在"], collocations: ["dominant powers（主导力量）","agree on the need for（一致认为需要……）","harmonization（协调统一）","disagree about（对……有分歧）"] }},
    { num: "③", en: "Germany thinks the euro must be saved by stricter rules on borrowing, spending and competitiveness, backed by quasi-automatic sanctions for governments that do not obey.", ref: "德国认为若想拯救欧元，必须在借贷支出以及竞争力等方面制定更加严格的准则，同时对违规的政府施以准自动制裁。",
      ai: { backbone: "主语 Germany、谓语 thinks、宾语从句 the euro must be saved by stricter rules", structure: ["宾语从句 the euro must be saved by stricter rules on borrowing, spending and competitiveness：作 thinks 的宾语","介词短语 on borrowing, spending and competitiveness：说明规则针对的方面","过去分词短语 backed by quasi-automatic sanctions：作后置定语，修饰 rules","介词短语 for governments：说明制裁对象","定语从句 that do not obey：修饰 governments"], collocations: ["stricter rules（更严格的规则）","quasi-automatic sanctions（准自动制裁）","borrowing, spending and competitiveness（借贷、支出和竞争力）"] }},
    { num: "④", en: "These might include threats to freeze EU funds for poorer regions and EU mega-projects, and even the suspension of a country’s voting rights in EU ministerial councils.", ref: "这些制裁可以包括威胁冻结欧盟对较贫困地区及欧盟巨型项目的投资，甚至包含暂停一国在欧盟部长理事会中的投票权。",
      ai: { backbone: "主语 These、谓语 might include、宾语 threats to freeze EU funds and the suspension of a country’s voting rights", structure: ["不定式短语 to freeze EU funds for poorer regions and EU mega-projects：作后置定语，修饰 threats","介词短语 for poorer regions and EU mega-projects：说明冻结对象","并列宾语 the suspension of a country’s voting rights：与 threats 并列","介词短语 in EU ministerial councils：说明投票权所在"], collocations: ["freeze EU funds（冻结欧盟资金）","poorer regions（较贫困地区）","mega-projects（大型项目）","the suspension of voting rights（暂停投票权）","ministerial councils（部长理事会）"] }},
    { num: "⑤", en: "It insists that economic co-ordination should involve all 27 members of the EU club, among whom there is a small majority for free-market liberalism and economic rigour; in the inner core alone, Germany fears, a small majority favor French interference.", ref: "德国坚持认为经济协作应该包含欧盟俱乐部的所有 27 国成员，在它们当中，支持自由市场自由主义和从严的经济政策占微弱多数；（不过）单从内部核心来看，德国担心，微弱多数会支持法国的干涉。",
      ai: { backbone: "主语 It、谓语 insists、宾语从句 that economic co-ordination should involve all 27 members；分号后的插入句 Germany fears", structure: ["宾语从句 that economic co-ordination should involve all 27 members of the EU club：作 insists 的宾语","介词短语 of the EU club：说明成员所属","非限制性定语从句 among whom there is a small majority for free-market liberalism and economic rigour：修饰 members","插入句 in the inner core alone, Germany fears, a small majority favor French interference：补充说明内圈国家的情况"], collocations: ["insist that...should（坚持……应当）","economic co-ordination（经济协调）","free-market liberalism（自由市场自由主义）","economic rigour（经济严苛性）","in the inner core（在内圈核心国家中）","favor French interference（支持法国的干预）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "euron.欧元", word: "euro", meaning: "n.欧元" },
      { raw: "backv.支持，资助", word: "back", meaning: "v.支持，资助" },
      { raw: "competitivenessn.竞争力", word: "competitiveness", meaning: "n.竞争力" },
      { raw: "obeyv.遵守，服从", word: "obey", meaning: "v.遵守，服从" },
      { raw: "sanctionn.制裁，惩罚", word: "sanction", meaning: "n.制裁，惩罚" },
      { raw: "quasi-automaticsanctions准自动制裁", word: "quasi-automaticsanctions准自动制裁", meaning: "" }
    ],
        split: "Germanythinks//(that)theeuromustbesavedbystricterrules//onborrowing, spendingandcompetitiveness,//backedbyquasi-automaticsanctions//for governments//thatdonotobey.",
        grammar: ["主干：主+谓+宾语从句", "主干结构提炼：Germanythinksthat...", "thinks后省略连接词that，引导宾语从句", "“onborrowing...andcompetitiveness”是介词短语作后置定语（修饰rules）", "backedby...是过去分词短语作后置定语（修饰rules）", "that引导定语从句（修饰governments）"],
        ref: "德国认为若想拯救欧元，必须在借贷、支出以及竞争力等方面制定更加严格的准则，同时对违规的政府施以准自动制裁。"
      }
    ]
  },
  {
    day: 129,
    type: "英二",
    source: "2011 Text 4",
    zh: "法国统领的“南部”阵营则另有所求：在欧元区成员国的内部核心成立一个“欧洲经济政府”。换种说法就是，通过“欧洲共同债券或完整的财政转移实现政府的低息借贷”这种形式，政客们对货币政策以及富裕成员国到贫困成员国的收入再分配体制实施干预。最后，那些亲近法国政府的重要人士私下抱怨说，欧元区成员国应该就财政和社会的统一措施达成共识，比如抑制企业税率或劳动力成本方面的竞争。",
    sentences: [
    { num: "①", en: "A “southern” camp headed by France wants something different: “European economic government” within an inner core of euro-zone members.", ref: "法国统领的“南部”阵营则另有所求：在欧元区成员国的内部核心成立一个“欧洲经济政府”。",
      ai: { backbone: "主语 A “southern” camp、谓语 wants、宾语 something different", structure: ["过去分词短语 headed by France：作后置定语，修饰 camp","冒号后的 “European economic government” within an inner core of euro-zone members：具体说明想要的内容"], collocations: ["headed by（由……领导）","European economic government（欧洲经济政府）","an inner core of（……的内圈核心）","euro-zone members（欧元区成员）"] }},
    { num: "②", en: "Translated, that means politicians intervening in monetary policy and a system of redistribution from richer to poorer members, via cheaper borrowing for governments through common Eurobonds or complete fiscal transfers.", ref: "换种说法就是，通过“欧洲共同债券或完整的财政转移实现政府的低息借贷”这种形式，政客们对货币政策以及富裕成员国到贫困成员国的收入再分配体制实施干预。",
      ai: { backbone: "主语 that、谓语 means、宾语 politicians intervening in monetary policy and a system of redistribution", structure: ["过去分词短语 Translated：作评注性状语，表示“换句话说/翻译过来就是”","动名词短语 politicians intervening in monetary policy：作 means 的宾语之一","介词短语 in monetary policy：说明干预的领域","名词短语 a system of redistribution：作并列宾语之二","介词短语 from richer to poorer members：说明再分配方向","介词短语 via cheaper borrowing for governments：作方式状语，说明实现途径","介词短语 through common Eurobonds or complete fiscal transfers：说明具体手段"], collocations: ["intervene in（干预）","monetary policy（货币政策）","a system of redistribution（再分配体系）","from richer to poorer members（从较富成员到较穷成员）","cheaper borrowing（更廉价的借贷）","common Eurobonds（共同欧元债券）","fiscal transfers（财政转移）"] }},
    { num: "③", en: "Finally, figures close to the French government have murmured, euro-zone members should agree to some fiscal and social harmonization: e.g. , curbing competition in corporate-tax rates or labor costs.", ref: "最后，那些亲近法国政府的重要人士私下抱怨说，欧元区成员国应该就财政和社会的统一措施达成共识，比如抑制企业税率或劳动力成本方面的竞争。",
      ai: { backbone: "主句：主语 euro-zone members、谓语 should agree to、宾语 some fiscal and social harmonization；插入语 figures close to the French government have murmured", structure: ["副词 Finally：作状语，表示“最后”","插入语 figures close to the French government have murmured：说明消息来源","介词短语 close to the French government：作后置定语，修饰 figures","介词短语 e.g., curbing competition in corporate-tax rates or labor costs：举例说明协调内容"], collocations: ["agree to（同意）","fiscal and social harmonization（财政和社会协调）","curb competition（抑制竞争）","corporate-tax rates（公司税率）","labor costs（劳动力成本）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "translatev.翻译", word: "translate", meaning: "v.翻译" },
      { raw: "intervenev.干预，干涉", word: "intervene", meaning: "v.干预，干涉" },
      { raw: "redistributionn.重新分配", word: "redistribution", meaning: "n.重新分配" },
      { raw: "viaprep.通过", word: "via", meaning: "prep.通过" },
      { raw: "monetarypolicy货币政策", word: "monetarypolicy货币政策", meaning: "" },
      { raw: "commonEurobonds欧洲共同债券", word: "commonEurobonds欧洲共同债券", meaning: "" },
      { raw: "fiscaltransfer财政转移", word: "fiscaltransfer财政转移", meaning: "" }
    ],
        split: "Translated,//thatmeanspoliticiansintervening//inmonetarypolicy//andasystem ofredistribution//fromricher//topoorermembers,//viacheaperborrowingfor governments//throughcommonEurobonds//orcompletefiscaltransfers.",
        grammar: ["主干：主+谓+宾", "主干结构提炼：thatmeanspoliticiansinterveningandasystemofredistribution", "translated是过去分词作状语，相当于Whenthatistranslated表示“翻译过来”", "“inmonetarypolicy”是介词短语作后置定语（修饰intervening）", "“fromrichertopoorermembers”是介词短语作后置定语（修饰redistribution）", "“viacheaper...fiscaltransfers”是介词短语作方式状语"],
        ref: "换种说法就是，这意味着，一方面政客会干预货币政策，另一方面会建立一套在富裕成员国与贫困成员国间进行财富再分配的机制，具体方式是“欧洲共同债券或完整的财政转移实现政府的低息借贷”。"
      }
    ]
  },
  {
    day: 130,
    type: "英二",
    source: "2011 Text 4",
    zh: "就这么宣判欧盟的死刑还为时过早。它仍是世界最大的贸易组织。在最佳状况下，这一欧洲大工程（即欧盟计划）相当自由：建立在一个由 27 个贫富不一的国家所组成的单一市场之上其内部边界对商品、资金以及劳动力的开放程度比任何一个具有可比性的贸易区都高得多。欧盟工程是一次雄心壮举：意在钝化全球化的尖锐棱角，让资本主义朝着良性发展。",
    sentences: [
    { num: "①", en: "It is too soon to write off the EU.", ref: "就这么宣判欧盟的死刑还为时过早。",
      ai: { backbone: "主语 It、谓语 is、表语 too soon、不定式 to write off the EU", structure: ["形式主语 It：真正主语为不定式 to write off the EU","副词 too：作状语，表示“太”"], collocations: ["too soon to do（做某事为时过早）","write off（放弃，看扁）"] }},
    { num: "②", en: "It remains the world’s largest trading block.", ref: "它仍是世界最大的贸易组织。",
      ai: { backbone: "主语 It、谓语 remains、表语 the world’s largest trading block", structure: ["代词 It 指代欧盟"], collocations: ["the world’s largest trading block（世界最大的贸易集团）"] }},
    { num: "③", en: "At its best, the European project is remarkably liberal: built around a single market of 27 rich and poor countries, its internal borders are far more open to goods, capital and labour than any comparable trading area.", ref: "在最佳状况下，这一欧洲大工程（即欧盟计划）相当自由：建立在一个由 27 个贫富不一的国家所组成的单一市场之上其内部边界对商品、资金以及劳动力的开放程度比任何一个具有可比性的贸易区都高得多。",
      ai: { backbone: "主句：主语 its internal borders、谓语 are、表语 far more open；状语 At its best", structure: ["介词短语 At its best：作状语，表示“在其最佳状态下”","副词 remarkably：作状语，修饰 liberal","现在分词短语 built around a single market of 27 rich and poor countries：作后置定语，修饰 the European project","介词短语 of 27 rich and poor countries：说明单一市场构成","介词短语 to goods, capital and labour：说明开放的对象","比较状语 than any comparable trading area：说明比较对象"], collocations: ["at its best（处于最佳状态）","remarkably liberal（极其自由开放的）","a single market（单一市场）","internal borders（内部边界）","be open to（对……开放）","a comparable trading area（可比的贸易区）"] }},
    { num: "④", en: "It is an ambitious attempt to blunt the sharpest edges of globalization, and make capitalism benign.", ref: "欧盟工程是一次雄心壮举：意在钝化全球化的尖锐棱角，让资本主义朝着良性发展。",
      ai: { backbone: "主语 It、谓语 is、表语 an ambitious attempt；不定式 to blunt the sharpest edges", structure: ["代词 It 指代欧洲一体化计划","介词短语 to blunt the sharpest edges of globalization：作后置定语，修饰 attempt","并列不定式 and make capitalism benign：与前面的不定式并列"], collocations: ["an ambitious attempt（雄心勃勃的尝试）","blunt the sharpest edges（钝化最尖锐的棱角）","make capitalism benign（使资本主义变得温和）"] }}
    ]
  },
  {
    day: 131,
    type: "英二",
    source: "2012 Text 1",
    zh: "家庭作业从来就不曾得到学生甚至许多父母的真正欢迎，但近几年尤其饱受诟病。全国的学区，如最近的洛杉矶联合学区，都在修改他们有关此教育惯例的思路。不幸的是，洛杉矶联合学区制定了一项硬性规定，责令除某些高级课程之外，家庭作业在学生学业成绩中所占比例不得超过 10%。",
    sentences: [
    { num: "①", en: "Homework has never been terribly popular with students and even many parents, but in recent years it has been particularly scorned.", ref: "家庭作业从来就不曾得到学生甚至许多父母的真正欢迎，但近几年尤其饱受诟病。",
      ai: { backbone: "主句：主语 Homework、谓语 has never been popular、状语 with students and even many parents；转折并列句 but it has been particularly scorned", structure: ["介词短语 with students and even many parents：说明在谁那里不受欢迎","时间状语 in recent years：说明时间","副词 particularly：作状语，修饰 scorned"], collocations: ["be popular with（受……欢迎）","in recent years（近年来）","be scorned（被鄙视）"] }},
    { num: "②", en: "School districts across the country, most recently Los Angeles Unified, are revising their thinking on his educational ritual.", ref: "全国的学区，如最近的洛杉矶联合学区，都在修改他们有关此教育惯例的思路。",
      ai: { backbone: "主语 School districts、谓语 are revising、宾语 their thinking", structure: ["介词短语 across the country：说明范围","插入语 most recently Los Angeles Unified：举例说明最近的代表","介词短语 on his educational ritual：说明思考的对象"], collocations: ["school districts（学区）","across the country（全国）","revise one’s thinking on（修正对……的看法）","educational ritual（教育惯例）"] }},
    { num: "③", en: "Unfortunately, L. A. Unified has produced an inflexible policy which mandates that with the exception of some advanced courses, homework may no longer count for more than 10% of a student’s academic grade.", ref: "不幸的是，洛杉矶联合学区制定了一项硬性规定，责令除某些高级课程之外，家庭作业在学生学业成绩中所占比例不得超过 10%。",
      ai: { backbone: "主句：主语 L. A. Unified、谓语 has produced、宾语 an inflexible policy；定语从句 which mandates", structure: ["副词 Unfortunately：作评注性状语","定语从句 which mandates that with the exception of some advanced courses, homework may no longer count for more than 10% of a student’s academic grade：修饰 policy","宾语从句 that homework may no longer count for more than 10%：作 mandates 的宾语","介词短语 with the exception of some advanced courses：作条件状语","介词短语 of a student’s academic grade：说明占比的对象"], collocations: ["an inflexible policy（死板的规定）","mandate that（规定）","with the exception of（除……以外）","advanced courses（高级课程）","count for（占……比重）","a student’s academic grade（学生的学业成绩）"] }}
    ]
  },
  {
    day: 132,
    type: "英二",
    source: "2012 Text 1",
    zh: "此规定旨在解决贫困或混乱家庭学生在完成家庭作业方面可能存有的困难。但政策内容不明且自相矛盾。当然，不应给学生布置他们无法独立完成或者需要贵重设备才能完成的家庭作业。但如果学区本质上是在给那些因家庭复杂而不做作业的学生以通行证，则近于冒险暗示应降低对贫困孩子的标准。",
    sentences: [
    { num: "①", en: "This rule is meant to address the difficulty that students from impoverished or chaotic homes might have in completing their homework.", ref: "此规定旨在解决贫困或混乱家庭学生在完成家庭作业方面可能存有的困难。",
      ai: { backbone: "主语 This rule、谓语 is meant to address、宾语 the difficulty", structure: ["定语从句 that students from impoverished or chaotic homes might have in completing their homework：修饰 the difficulty","介词短语 from impoverished or chaotic homes：作后置定语，修饰 students","介词短语 in completing their homework：与 have 搭配，说明困难所在"], collocations: ["be meant to do（旨在）","impoverished or chaotic homes（贫困或混乱的家庭）","complete homework（完成作业）"] }},
    { num: "②", en: "But the policy is unclear and contradictory.", ref: "但政策内容不明且自相矛盾。",
      ai: { backbone: "主语 the policy、谓语 is、表语 unclear and contradictory", structure: ["转折连词 But：表转折"], collocations: ["unclear and contradictory（含糊且自相矛盾）"] }},
    { num: "③", en: "Certainly, no homework should be assigned that students cannot complete on their own or that they cannot do without expensive equipment.", ref: "当然，不应给学生布置他们无法独立完成或者需要贵重设备才能完成的家庭作业。",
      ai: { backbone: "主句：no homework should be assigned；定语从句 that students cannot complete", structure: ["副词 Certainly：作评注性状语","定语从句 that students cannot complete on their own：修饰 homework","并列定语从句 or that they cannot do without expensive equipment：与前面的 that 从句并列修饰 homework"], collocations: ["assign homework（布置作业）","on one’s own（独自）","expensive equipment（昂贵的设备）"] }},
    { num: "④", en: "But if the district is essentially giving a pass to students who do not do their homework because of complicated family lives, it is going riskily close to the implication that standards need to be lowered for poor children.", ref: "但如果学区本质上是在给那些因家庭复杂而不做作业的学生以通行证，则近于冒险暗示应降低对贫困孩子的标准。",
      ai: { backbone: "主句：主语 it、谓语 is going、表语 riskily close to the implication；条件状语从句 if the district is essentially giving a pass to students", structure: ["条件状语从句 if the district is essentially giving a pass to students who do not do their homework：说明条件","定语从句 who do not do their homework because of complicated family lives：修饰 students","介词短语 because of complicated family lives：说明原因","同位语从句 that standards need to be lowered for poor children：解释说明 the implication"], collocations: ["give a pass to（对……放行/网开一面）","complicated family lives（复杂的家庭生活）","be close to the implication that（接近……的含义）","lower standards（降低标准）"] }}
    ],
    analysis: [
      {
        sentNum: "④",
        vocab: [
      { raw: "districtn.地区，区域（学区）", word: "district", meaning: "n.地区，区域（学区）" },
      { raw: "complicatedadj.复杂的", word: "complicated", meaning: "adj.复杂的" },
      { raw: "implicationn.暗示", word: "implication", meaning: "n.暗示" },
      { raw: "giveapasstosb.对某人放行/网开一面/免予处罚", word: "giveapasstosb.对某人放行/网开一面/免予处罚", meaning: "" },
      { raw: "goclosetosth.近乎/接近某事", word: "goclosetosth.近乎/接近某事", meaning: "" }
    ],
        split: "Butifthedistrictisessentiallygivingapass//tostudents//whodonotdotheir homework//becauseofcomplicatedfamilylives,//itisgoingriskilyclosetothe implication//thatstandardsneedtobelowered//forpoorchildren.",
        grammar: ["主干：主+谓+宾", "主干结构提炼：Itisgoingclosetotheimplication", "if引导状语从句", "who引导定语从句（修饰students）", "becauseofcomplicatedfamilylives是原因状语说明“不做作业”的原因", "that引导同位语从句（解释implication）", "goclosetosth.近乎/接近某事"],
        ref: "但如果学区本质上是给那些因为家庭复杂而不做作业的学生以通行证，则近于冒险暗示：应降低对贫困孩子的标准。"
      }
    ]
  },
  {
    day: 133,
    type: "英二",
    source: "2012 Text 1",
    zh: "学区管理者表示，家庭作业仍将是学校教育的一部分；教师可以自主安排作业量。但在家庭作业仅占学业成绩的 10% 的情形下，学生大可逃掉一半的作业而成绩单却几乎不会有变化。有些学生可能没做家庭作业也会在州考中表现良好，但那些做了家庭作业且在州考中表现良好的学生又该怎么解释呢？很有可能家庭作业起到了助益作用。然而该政策不是授权教师去探索什么样的方式最适合学生，而是强制颁布一项呆板的、一刀切的规定。",
    sentences: [
    { num: "①", en: "District administrators say that homework will still be a part of schooling: teachers are allowed to assign as much of it as they want.", ref: "学区管理者表示，家庭作业仍将是学校教育的一部分；教师可以自主安排作业量。",
      ai: { backbone: "主语 District administrators、谓语 say、宾语从句 that homework will still be a part of schooling", structure: ["宾语从句 that homework will still be a part of schooling：作 say 的宾语","冒号后的句子 teachers are allowed to assign as much of it as they want：补充说明具体做法"], collocations: ["district administrators（学区管理者）","a part of schooling（学校教育的一部分）","be allowed to do（被允许做某事）","as much as they want（想布置多少就布置多少）"] }},
    { num: "②", en: "But with homework counting for no more than 10% of their grades, students can easily skip half their homework and see very little difference on their report cards.", ref: "但在家庭作业仅占学业成绩的 10% 的情形下，学生大可逃掉一半的作业而成绩单却几乎不会有变化。",
      ai: { backbone: "主句：主语 students、谓语 can easily skip、宾语 half their homework；原因状语 with homework counting for no more than 10%", structure: ["介词短语 with homework counting for no more than 10% of their grades：作原因状语（独立主格结构）","介词短语 of their grades：说明占比对象","并列分句 and see very little difference on their report cards：说明结果"], collocations: ["count for（占……比重）","skip homework（跳过作业）","report cards（成绩单）"] }},
    { num: "③", en: "Some students might do well on state tests without completing their homework, but what about the students who performed well on the tests and did their homework?", ref: "有些学生可能没做家庭作业也会在州考中表现良好，但那些做了家庭作业且在州考中表现良好的学生又该怎么解释呢？",
      ai: { backbone: "并列疑问句：句1 主语 Some students、谓语 might do well、状语 on state tests；句2 主语 the students、谓语 did、宾语 their homework", structure: ["介词短语 without completing their homework：作条件状语","转折连词 but：表转折","疑问句 what about the students who performed well on the tests and did their homework？：表示“那么……呢”","定语从句 who performed well on the tests and did their homework：修饰 the students"], collocations: ["do well on state tests（在州考中取得好成绩）","what about（那……呢）","perform well（表现良好）"] }},
    { num: "④", en: "It is quite possible that the homework helped.", ref: "很有可能家庭作业起到了助益作用。",
      ai: { backbone: "主语 It、谓语 is、表语 quite possible；主语从句 that the homework helped", structure: ["形式主语 It：真正主语为 that 从句","副词 quite：加强语气"], collocations: ["it is quite possible that（很有可能……）"] }},
    { num: "⑤", en: "Yet rather than empowering teachers to find what works best for their students, the policy imposes a flat, across-the-board rule.", ref: "然而该政策不是授权教师去探索什么样的方式最适合学生，而是强制颁布一项呆板的、一刀切的规定。",
      ai: { backbone: "主句：主语 the policy、谓语 imposes、宾语 a flat, across-the-board rule；让步状语从句 rather than empowering teachers", structure: ["介词短语 Rather than empowering teachers to find what works best for their students：作状语，表示“而不是……”","不定式短语 to find what works best：作目的状语","宾语从句 what works best for their students：作 find 的宾语","介词短语 Yet：表转折"], collocations: ["rather than（而不是）","empower teachers（赋予教师权力）","a flat, across-the-board rule（一刀切的统一规定）"] }}
    ]
  },
  {
    day: 134,
    type: "英二",
    source: "2012 Text 1",
    zh: "与此同时，该政策并未解决任何关于家庭作业的真正棘手问题。如果学区发现家庭作业对学生的学业成绩影响不大，那么它应该减少甚至排除家庭作业，而不是让其在成绩中的比重变得微乎其微。相反，如果家庭作业确实重要，那就应该让其在成绩中占据重要比例。并且，这一政策并未采取任何措施确保学生的家庭作业对于他们的年龄和学科来说是有意义且合适的，也不能确保教师布置的作业量未超过他们愿意批改的量。有关家庭作业的规定应暂缓实施，而负责制定教育政策的校董事会应深入调查并举行公众听证会。洛杉矶联合学区要正确对待家庭作业，现在还为时不晚。",
    sentences: [
    { num: "①", en: "At the same time, the policy addresses none of the truly thorny questions about homework.", ref: "与此同时，该政策并未解决任何关于家庭作业的真正棘手问题。",
      ai: { backbone: "主句：主语 the policy、谓语 addresses、宾语 none of the questions；时间状语 At the same time", structure: ["介词短语 At the same time：作时间状语","介词短语 of the truly thorny questions：作后置定语，修饰 none","介词短语 about homework：作后置定语，修饰 questions"], collocations: ["at the same time（与此同时）","address questions（处理问题）","truly thorny questions（真正棘手的问题）"] }},
    { num: "②", en: "If the district finds homework to be unimportant to its students’ academic achievement, it should move to reduce or eliminate the assignments, not make them count for almost nothing.", ref: "如果学区发现家庭作业对学生的学业成绩影响不大，那么它应该减少甚至排除家庭作业，而不是让其在成绩中的比重变得微乎其微。",
      ai: { backbone: "主句：主语 it、谓语 should move to reduce or eliminate、宾语 the assignments；条件状语从句 If the district finds homework to be unimportant", structure: ["条件状语从句 If the district finds homework to be unimportant to its students’ academic achievement：说明条件","介词短语 to its students’ academic achievement：说明不重要的对象","转折连词 not 与 but 的对比：not make them count for almost nothing","介词短语 for almost nothing：说明占比几乎为零"], collocations: ["find...to be unimportant（认为……不重要）","academic achievement（学业成就）","reduce or eliminate（减少或取消）","count for almost nothing（几乎不起任何作用）"] }},
    { num: "③", en: "Conversely, if homework matters, it should account for a significant portion of the grade.", ref: "相反，如果家庭作业确实重要，那就应该让其在成绩中占据重要比例。",
      ai: { backbone: "主句：主语 it、谓语 should account for、宾语 a significant portion of the grade；条件状语从句 if homework matters", structure: ["副词 Conversely：作评注性状语，表示“反之”","条件状语从句 if homework matters：说明条件","介词短语 of the grade：说明占比对象"], collocations: ["conversely（反之）","matter（重要）","account for（占……比重）","a significant portion of（……的重要部分）"] }},
    { num: "④", en: "Meanwhile, this policy does nothing to ensure that the homework students receive is meaningful or appropriate to their age and the subject, or that teachers are not assigning more than they are willing to review and correct.", ref: "并且，这一政策并未采取任何措施确保学生的家庭作业对于他们的年龄和学科来说是有意义且合适的，也不能确保教师布置的作业量未超过他们愿意批改的量。",
      ai: { backbone: "主句：主语 this policy、谓语 does nothing to ensure、宾语从句 that the homework is meaningful", structure: ["时间状语 Meanwhile：作状语，表示“同时”","不定式短语 to ensure：作目的状语","宾语从句 that the homework students receive is meaningful or appropriate to their age and the subject：作 ensure 的宾语","定语从句 students receive：修饰 the homework（省略了关系代词 that）","并列宾语从句 or that teachers are not assigning more than they are willing to review and correct：与前面的 that 从句并列","比较状语从句 more than they are willing to review and correct：说明布置作业的量超过愿意批改的量"], collocations: ["do nothing to ensure（不采取任何措施确保）","be appropriate to（适合……）","review and correct（批改）","be willing to do（愿意做某事）"] }},
    { num: "⑤", en: "The homework rules should be put on hold while the school board, which is responsible for setting educational policy, looks into the matter and conducts public hearings.", ref: "有关家庭作业的规定应暂缓实施，而负责制定教育政策的校董事会应深入调查并举行公众听证会。",
      ai: { backbone: "主句：主语 The homework rules、谓语 should be put on hold；时间状语从句 while the school board looks into the matter", structure: ["时间状语从句 while the school board, which is responsible for setting educational policy, looks into the matter and conducts public hearings：表示“在……期间”","非限制性定语从句 which is responsible for setting educational policy：修饰 the school board","并列谓语 looks into the matter and conducts public hearings"], collocations: ["put...on hold（搁置）","the school board（学校董事会）","be responsible for（负责）","look into（调查）","conduct public hearings（举行公开听证会）"] }},
    { num: "⑥", en: "It is not too late for L.A. Unified to do homework right.", ref: "洛杉矶联合学区要正确对待家庭作业，现在还为时不晚。",
      ai: { backbone: "主语 It、谓语 is、表语 not too late、不定式 for L.A. Unified to do homework right", structure: ["形式主语 It：真正主语为 for L.A. Unified to do homework right","副词 too：作状语"], collocations: ["it is not too late to do（做某事还不算太晚）","do homework right（正确布置作业）"] }}
    ],
    analysis: [
      {
        sentNum: "④",
        vocab: [
      { raw: "ensurev.确保，保证", word: "ensure", meaning: "v.确保，保证" },
      { raw: "appropriateadj.合适的", word: "appropriate", meaning: "adj.合适的" }
    ],
        split: "Meanwhile,//thispolicydoesnothing//toensure//thatthehomework//(that) studentsreceiveismeaningfulorappropriate//totheirage//andthesubject,//orthat teachersarenotassigningmore//thantheyarewillingtoreviewandcorrect.",
        grammar: ["主干：主+谓+宾", "结构提炼：thispolicydoesnothingtoeusurethatA,orthatB", "toensurethat...是不定式作目的状语", "ensure后的that引导宾语从句", "or并列两个宾语从句（that...orthat...）", "定语从句省略that：thehomework(that)studentsreceive", "宾语从句1内部：主系表（thehomeworkismeaningfulorappropriate）", "宾语从句2内部：主谓宾（teachersarenotassigningmore）", "than引导比较状语从句：thantheyarewillingtoreviewandcorrect"],
        ref: "与此同时，这一政策根本无法确保学生的家庭作业对于他们的年龄和学科来说是有意义且合适的，也不能确保教师布置的作业量未超过他们愿意批改的量。"
      }
    ]
  },
  {
    day: 135,
    type: "英二",
    source: "2012 Text 2",
    zh: "穿粉色好看：成年女性不记得自己曾如此痴迷这种颜色，然而它却充斥着我们年轻女孩的生活。并不是粉色本身不好，而是它只是七色彩虹中那么一丝而已；尽管粉色在某种程度上能为少女时代添色，但它也一而再、强有力地将女孩的身份与外表相融合。此后，粉色就呈现出女孩间，甚至两岁女孩间的共性：纯真，而且粉色也被当成了女孩纯真的证明。环顾四周，我绝望地发现，人们对女孩生活和兴趣的想象是如此地贫乏。",
    sentences: [
    { num: "①", en: "Pretty in pink: adult women do not remember being so obsessed with the color, yet it is pervasive in our young girls’ lives.", ref: "穿粉色好看：成年女性不记得自己曾如此痴迷这种颜色，然而它却充斥着我们年轻女孩的生活。",
      ai: { backbone: "主句：主语 adult women、谓语 do not remember being obsessed；并列句 and it is pervasive", structure: ["介词短语 Pretty in pink：作评注性状语，说明话题","介词短语 with the color：说明痴迷的对象","介词短语 in our young girls’ lives：说明范围"], collocations: ["pretty in pink（穿粉色很漂亮）","be obsessed with（痴迷于）","be pervasive in（在……中普遍存在）","young girls’ lives（小女孩的生活）"] }},
    { num: "②", en: "It is not that pink is intrinsically bad, but it is such a tiny slice of the rainbow and, though it may celebrate girlhood in one way, it also repeatedly and firmly fuses girls’ identity to appearance.", ref: "并不是粉色本身不好，而是它只是七色彩虹中那么一丝而已；尽管粉色在某种程度上能为少女时代添色，但它也一而再、强有力地将女孩的身份与外表相融合。",
      ai: { backbone: "主句：主语 it、谓语 is、表语 not that pink is intrinsically bad；转折并列句 but it is such a tiny slice of the rainbow", structure: ["表语从句 not that pink is intrinsically bad：说明并非粉色本身不好","转折连词 but：表转折","让步状语从句 though it may celebrate girlhood in one way：表示让步","并列谓语 it also repeatedly and firmly fuses girls’ identity to appearance：说明另一方面的影响","介词短语 to appearance：说明融合的对象"], collocations: ["intrinsically bad（本质上不好）","a tiny slice of the rainbow（彩虹中很小的一片）","celebrate girlhood（颂扬少女时代）","fuse...to...（把……与……融合）","girls’ identity（女孩的身份认同）"] }},
    { num: "③", en: "Then it presents that connection, even among two-year-olds, between girls as not only innocent but as evidence of innocence.", ref: "此后，粉色就呈现出女孩间，甚至两岁女孩间的共性：纯真，而且粉色也被当成了女孩纯真的证明。",
      ai: { backbone: "主语 it、谓语 presents、宾语 that connection", structure: ["时间状语 Then：作状语","介词短语 even among two-year-olds：说明范围","介词短语 between girls：说明连接的双方","介词短语 as not only innocent but as evidence of innocence：说明呈现的方式（not only...but...）"], collocations: ["present...as（把……呈现为）","not only...but...（不仅……而且……）","evidence of innocence（纯真的证据）"] }},
    { num: "④", en: "Looking around, I despaired at the singular lack of imagination about girls’ lives and interests.", ref: "环顾四周，我绝望地发现，人们对女孩生活和兴趣的想象是如此地贫乏。",
      ai: { backbone: "主句：主语 I、谓语 despaired、状语 at the singular lack of imagination", structure: ["现在分词短语 Looking around：作时间状语","介词短语 at the singular lack of imagination：与 despair 搭配","介词短语 about girls’ lives and interests：作后置定语，修饰 imagination"], collocations: ["look around（环顾四周）","despair at（对……感到绝望）","a singular lack of（极度的缺乏）","girls’ lives and interests（女孩的生活和兴趣）"] }}
    ]
  },
  {
    day: 136,
    type: "英二",
    source: "2012 Text 2",
    zh: "女孩对粉色的青睐看起来似乎是无法避免的，似乎在某种程度上被编码进了她们的 DNA。不过，根据美国研究副教授乔帕雷提的说法，情况不是这样的。20 世纪初以前，儿童根本没有颜色编码：在家用洗衣机问世之前的年代里，出于实用角度，所有婴儿都穿白色衣服，因为将衣服洗干净的唯一方法是将衣服煮沸。而且，男孩、女孩都穿着被认为是中性的衣服。当育儿颜色引入之时，粉色实际上被认为是更具男性特征的颜色，是红色的清淡柔和版，与力量相关。而蓝色象征着女性特征，令人联想到圣母玛利亚，代表着坚贞与忠诚。直到 20世纪 80 年代中期，随着强化年龄和性别差异成为儿童市场主要营销策略时，粉色才盛行起来，开始对女孩产生一种看似固有的吸引力，这让粉色成为定义女性特质的一部分至少在最初关键的几年里是如此。",
    sentences: [
    { num: "①", en: "Girls’ attraction to pink may seem unavoidable, somehow encoded in their DNA, but according to Jo Paoletti, an associate professor of American Studies, it is not.", ref: "女孩对粉色的青睐看起来似乎是无法避免的，似乎在某种程度上被编码进了她们的 DNA。不过，根据美国研究副教授乔帕雷提的说法，情况不是这样的。",
      ai: { backbone: "主句：主语 it、谓语 is not、表语 unavoidable；转折并列句 but it is not", structure: ["介词短语 Girls’ attraction to pink：作主语（从句）","副词 somehow：作状语，表示“不知何故”","过去分词短语 encoded in their DNA：作后置定语，修饰 attraction","介词短语 according to Jo Paoletti, an associate professor of American Studies：作状语，说明依据","代词 it 指代女孩对粉色的痴迷"], collocations: ["attraction to（对……的吸引力）","be encoded in DNA（编码在DNA中）","according to（根据）","an associate professor of（……的副教授）"] }},
    { num: "②", en: "Children were not color-coded at all until the early 20th century: in the era before domestic washing machines all babies wore white as a practical matter, since the only way of getting clothes clean was to boil them.", ref: "20 世纪初以前，儿童根本没有颜色编码：在家用洗衣机问世之前的年代里，出于实用角度，所有婴儿都穿白色衣服，因为将衣服洗干净的唯一方法是将衣服煮沸。",
      ai: { backbone: "主句：主语 Children、谓语 were not color-coded、状语 at all；时间状语 until the early 20th century", structure: ["介词短语 until the early 20th century：说明时间截止点","冒号后的句子 in the era before domestic washing machines all babies wore white as a practical matter：解释说明","时间状语从句 since the only way of getting clothes clean was to boil them：说明原因","介词短语 before domestic washing machines：说明时代","介词短语 as a practical matter：说明实际原因"], collocations: ["be color-coded（按颜色区分）","domestic washing machines（家用洗衣机）","as a practical matter（出于实际考虑）","the only way of doing（做某事的唯一方法）","boil clothes（煮衣服）"] }},
    { num: "③", en: "What's more, both boys and girls wore what were thought of as gender-neutral dresses.", ref: "而且，男孩、女孩都穿着被认为是中性的衣服。",
      ai: { backbone: "主语 both boys and girls、谓语 wore、宾语 what were thought of as gender-neutral dresses", structure: ["短语 What's more：作评注性状语，表示“更重要的是”","宾语从句 what were thought of as gender-neutral dresses：作 wore 的宾语，其中 what 作主语","介词短语 as gender-neutral dresses：与 thought of 搭配"], collocations: ["what's more（更重要的是）","gender-neutral dresses（性别中立的服装）","think of...as（把……看作）"] }},
    { num: "④", en: "When nursery colors were introduced, pink was actually considered the more masculine color, a pastel version of red, which was associated with strength.", ref: "当育儿颜色引入之时，粉色实际上被认为是更具男性特征的颜色，是红色的清淡柔和版，与力量相关。",
      ai: { backbone: "主句：主语 pink、谓语 was considered、宾补 the more masculine color；时间状语 When nursery colors were introduced", structure: ["时间状语从句 When nursery colors were introduced：说明时间","副词 actually：作状语","名词短语 a pastel version of red：作同位语，说明粉色是红色的柔和版","非限制性定语从句 which was associated with strength：修饰 red"], collocations: ["nursery colors（婴儿房的色彩）","the more masculine color（更具男性气质的颜色）","a pastel version of（……的柔和版本）","be associated with（与……相关）"] }},
    { num: "⑤", en: "Blue, with its intimations of the Virgin Mary, constancy and faithfulness, symbolized femininity.", ref: "而蓝色象征着女性特征，令人联想到圣母玛利亚，代表着坚贞与忠诚。",
      ai: { backbone: "主语 Blue、谓语 symbolized、宾语 femininity", structure: ["介词短语 with its intimations of the Virgin Mary, constancy and faithfulness：作伴随状语，说明蓝色蕴含的意义"], collocations: ["intimations of（……的暗示）","the Virgin Mary（圣母玛利亚）","constancy and faithfulness（忠贞与忠诚）","symbolize femininity（象征女性气质）"] }},
    { num: "⑥", en: "It was not until the mid-1980s, when amplifying age and sex differences became a dominant children’s marketing strategy, that pink fully came into its own, when it began to seem inherently attractive to girls, part of what defined them as female, at least for the first few critical years.", ref: "直到 20世纪 80 年代中期，随着强化年龄和性别差异成为儿童市场主要营销策略时，粉色才盛行起来，开始对女孩产生一种看似固有的吸引力，这让粉色成为定义女性特质的一部分至少在最初关键的几年里是如此。",
      ai: { backbone: "主句：it was not until the mid-1980s that pink fully came into its own（强调结构/时间状语从句）；时间状语从句 when amplifying age and sex differences became a dominant marketing strategy", structure: ["强调结构 it was not until...that...：表示“直到……才……”","时间状语从句 when amplifying age and sex differences became a dominant children’s marketing strategy：说明时间","时间状语从句 when it began to seem inherently attractive to girls：说明粉色开始吸引女孩的时间","名词短语 part of what defined them as female：作 girls 的补充说明","介词短语 for the first few critical years：说明时间范围"], collocations: ["it was not until...that...（直到……才……）","amplify differences（放大差异）","a dominant marketing strategy（占主导的营销策略）","come into one’s own（充分发挥作用，得心应手）","inherently attractive（天生有吸引力）","define...as female（把……定义为女性）"] }}
    ],
    analysis: [
      {
        sentNum: "⑥",
        vocab: [
      { raw: "amplifyv.放大，凸显", word: "amplify", meaning: "v.放大，凸显" },
      { raw: "dominantadj.占支配地位的，占优势的", word: "dominant", meaning: "adj.占支配地位的，占优势的" },
      { raw: "inherentlyadv.内在地，固有地", word: "inherently", meaning: "adv.内在地，固有地" },
      { raw: "criticaladj.关键的", word: "critical", meaning: "adj.关键的" },
      { raw: "comeintoone’sown盛行起来/发展成熟/终于等到了属于自己的舞台", word: "comeintoone’sown盛行起来/发展成熟/终于等到了属于自己的舞台", meaning: "" }
    ],
        split: "Itwasnotuntilthemid-1980s,//whenamplifyingageandsexdifferencesbecamea dominantchildren’smarketingstrategy,//thatpinkfullycameintoitsown,//whenit begantoseeminherentlyattractivetogirls,//partofwhatdefinedthem//asfemale, //atleast//forthefirstfewcriticalyears.",
        grammar: ["主干：主+谓", "主干结构提炼：Itwasnotuntilthemid-1980sthatpinkfullycameintoitsown", "Itwasnotuntil...that...“直到...才...”（强调句型），notuntilthemid-1980s是被", "强调内容，表示“直到20世纪80年代中期才”，在句中作时间状语", "两个when都是引导定语从句（修饰mid-1980s）", "it指代pink", "partofwhatdefinedthemasfemale是同位语，解释前面整件事，what引导宾语", "从句作of的宾语；definesb.as...把某人定义为...", "atleastforthefirstfewcriticalyears是状语，表示“至少在最初关键的几年里”"],
        ref: "直到20世纪80年代中期，随着强化年龄和性别差异成为儿童市场主要营销策略时，粉色才盛行起来，从那时起，粉色仿佛天生就对女孩充满吸引力，至少在最初关键的几年里，它成为定义女性特质的一部分。"
      }
    ]
  },
  {
    day: 137,
    type: "英二",
    source: "2012 Text 2",
    zh: "我之前并没有意识到，我们对儿童天性的看法深受市场营销趋势的支配，包括我们对他们心理发展的核心观念。以学步的儿童为例，我曾以为这个阶段只是专家对儿童行为的多年研究之后界定的结果：但是我错了。根据研究儿童消费主义的历史学家丹尼尔·库克的说法，它实际上是 20 世纪 30 年代被服装制造商作为一种营销技巧而得以普及。",
    sentences: [
    { num: "①", en: "I had not realized how profoundly marketing trends dictated our perception of what is natural to kids, including our core beliefs about their psychological development.", ref: "我之前并没有意识到，我们对儿童天性的看法深受市场营销趋势的支配，包括我们对他们心理发展的核心观念。",
      ai: { backbone: "主语 I、谓语 had not realized、宾语从句 how profoundly marketing trends dictated our perception", structure: ["宾语从句 how profoundly marketing trends dictated our perception of what is natural to kids：作 realized 的宾语","介词短语 of what is natural to kids：作后置定语，修饰 perception","介词短语 including our core beliefs about their psychological development：作插入补充","介词短语 about their psychological development：作后置定语，修饰 beliefs"], collocations: ["marketing trends（营销趋势）","dictate perception（左右认知）","core beliefs（核心信念）","psychological development（心理发展）"] }},
    { num: "②", en: "Take the toddler. I assumed that phase was something experts developed after years of research into children's behavior: wrong.", ref: "以学步的儿童为例，我曾以为这个阶段只是专家对儿童行为的多年研究之后界定的结果：但是我错了。",
      ai: { backbone: "祈使句：Take the toddler（独立成分）；主句：主语 I、谓语 assumed、宾语从句 that phase was something", structure: ["祈使句 Take the toddler：以幼儿为例","宾语从句 that phase was something experts developed after years of research into children's behavior：作 assumed 的宾语","定语从句 experts developed：修饰 something（省略了关系代词 that）","介词短语 after years of research：说明时间","介词短语 into children's behavior：说明研究对象","冒号后的 wrong：说明假设是错误的"], collocations: ["research into（对……的研究）","children's behavior（儿童行为）"] }},
    { num: "③", en: "Turns out, according to Daniel Cook, a historian of childhood consumerism, it was popularized as a marketing trick by clothing manufacturers in the 1930s.", ref: "根据研究儿童消费主义的历史学家丹尼尔·库克的说法，它实际上是 20 世纪 30 年代被服装制造商作为一种营销技巧而得以普及。",
      ai: { backbone: "主句：主语 it、谓语 was popularized、宾补 as a marketing trick；方式状语 by clothing manufacturers", structure: ["短语 Turns out：作评注性状语，表示“结果发现”","介词短语 according to Daniel Cook, a historian of childhood consumerism：作状语，说明依据","介词短语 as a marketing trick：说明被宣传为……","介词短语 in the 1930s：说明时间"], collocations: ["turns out（结果发现）","a historian of childhood consumerism（研究儿童消费主义的历史学家）","a marketing trick（营销把戏）","clothing manufacturers（服装制造商）"] }}
    ]
  },
  {
    day: 138,
    type: "英二",
    source: "2012 Text 2",
    zh: "贸易出版物建议百货商店：要增加销量就应该在婴儿服装和稍大一些孩子的服装之间创建“第三跳板”。直到“蹒跚学步儿童”变成一个常见购物者用语之后，这一“第三跳板”才演变为人们普遍认可的儿童发展阶段。将儿童或者成年人细分为更小的类别已经被证实一定能使商家增加利润。而对市场进行细分的一个最简单办法就是放大性别差异——或者当性别差异并非明显存在时创造出性别差异。",
    sentences: [
    { num: "①", en: "Trade publications counseled department stores that, in order to increase sales, they should create a “third stepping stone” between infant wear and older kids’ clothes.", ref: "贸易出版物建议百货商店：要增加销量就应该在婴儿服装和稍大一些孩子的服装之间创建“第三跳板”。",
      ai: { backbone: "主语 Trade publications、谓语 counseled、宾语 department stores、宾语从句 that they should create a “third stepping stone”", structure: ["宾语从句 that, in order to increase sales, they should create a “third stepping stone” between infant wear and older kids’ clothes：作 counseled 的宾语","介词短语 in order to increase sales：作目的状语","介词短语 between infant wear and older kids’ clothes：说明位置"], collocations: ["trade publications（行业刊物）","counsel...that（建议……）","department stores（百货商店）","increase sales（增加销售）","a third stepping stone（第三级台阶）","infant wear（婴儿服装）"] }},
    { num: "②", en: "It was only after “toddler” became a common shopper’ term that it evolved into a broadly accepted developmental stage.", ref: "直到“蹒跚学步儿童”变成一个常见购物者用语之后，这一“第三跳板”才演变为人们普遍认可的儿童发展阶段。",
      ai: { backbone: "主句：主语 it、谓语 evolved、状语 into a broadly accepted developmental stage；时间状语 It was only after “toddler” became a common shopper’ term", structure: ["强调结构 It was only after...that...：表示“直到……之后才……”","时间状语从句 after “toddler” became a common shopper’ term：说明时间","介词短语 into a broadly accepted developmental stage：说明演变结果"], collocations: ["it was only after...that...（直到……之后才……）","a common shopper's term（消费者常用术语）","evolve into（演变成）","a broadly accepted developmental stage（被广泛接受的发育阶段）"] }},
    { num: "③", en: "Splitting kids, or adults, into ever-tinier categories has proved a sure-fire way to boost profits.", ref: "将儿童或者成年人细分为更小的类别已经被证实一定能使商家增加利润。",
      ai: { backbone: "主语 Splitting kids, or adults, into ever-tinier categories、谓语 has proved、表语 a sure-fire way", structure: ["动名词短语 Splitting kids, or adults, into ever-tinier categories：作主语","介词短语 into ever-tinier categories：说明切分结果","不定式短语 to boost profits：作后置定语，修饰 way"], collocations: ["split into categories（切分为类别）","ever-tinier categories（越来越细的类别）","a sure-fire way to do（做某事的万无一失的方法）","boost profits（提升利润）"] }},
    { num: "④", en: "And one of the easiest ways to segment a market is to magnify gender differences—or invent them where they did not previously exist.", ref: "而对市场进行细分的一个最简单办法就是放大性别差异——或者当性别差异并非明显存在时创造出性别差异。",
      ai: { backbone: "主句：主语 one of the easiest ways、谓语 is、不定式 to magnify gender differences；方式状语 to segment a market", structure: ["介词短语 to segment a market：作后置定语，修饰 ways","不定式短语 to magnify gender differences：作表语","转折并列结构 or invent them where they did not previously exist：说明另一方式"], collocations: ["segment a market（细分市场）","magnify gender differences（放大性别差异）","previously exist（此前存在）"] }}
    ]
  },
  {
    day: 139,
    type: "英二",
    source: "2012 Text 3",
    zh: "2010 年，一位联邦法官彻底震惊了美国生物技术行业。此前数十年，公司们一直在享有分离 DNA 的专利——截止到 2005 年，约 20%的人类基因已被申请专利。但在 2010 年 3 月，一位法官做出裁决：基因不可申请专利。这让（生物技术公司）主管们发狂般地焦躁不安。作为贸易团体，生物技术工业组织（BIO）向其成员承诺，这只是一场长期战争的“第一步”。7 月 29 日，他们如释重负，至少暂时如此。联邦上诉法院推翻了先前判决，裁决 MyriadGenetics 公司的确可以拥有两项帮助预测女性乳腺癌风险的基因专利。位于犹他州的Myriad 公司的执行总裁认为，这一裁决无论对于公司还是对于病人都是一种福音。",
    sentences: [
    { num: "①", en: "In 2010, a federal judge shook America’s biotech industry to the core.", ref: "2010 年，一位联邦法官彻底震惊了美国生物技术行业。",
      ai: { backbone: "主语 a federal judge、谓语 shook、宾语 America’s biotech industry、宾补 to the core", structure: ["时间状语 In 2010：说明时间"], collocations: ["shake...to the core（使……深受震撼）","biotech industry（生物技术产业）"] }},
    { num: "②", en: "Companies had won patents for isolated DNA for decades—by 2005 some 20% of human genes were patented.", ref: "此前数十年，公司们一直在享有分离 DNA 的专利——截止到 2005 年，约 20%的人类基因已被申请专利。",
      ai: { backbone: "主语 Companies、谓语 had won、宾语 patents for isolated DNA", structure: ["时间状语 for decades：说明时间","破折号后的补充说明 by 2005 some 20% of human genes were patented：说明专利覆盖范围","介词短语 by 2005：说明时间"], collocations: ["win patents for（赢得……的专利）","isolated DNA（分离出的DNA）","human genes（人类基因）","be patented（获得专利）"] }},
    { num: "③", en: "But in March 2010 a judge ruled that genes were unpatentable.", ref: "但在 2010 年 3 月，一位法官做出裁决：基因不可申请专利。",
      ai: { backbone: "主语 a judge、谓语 ruled、宾语从句 that genes were unpatentable；时间状语 in March 2010", structure: ["转折连词 But：表转折","时间状语 in March 2010：说明时间","宾语从句 that genes were unpatentable：作 ruled 的宾语"], collocations: ["rule that（裁定）","unpatentable（不能申请专利的）"] }},
    { num: "④", en: "Executives were violently agitated.", ref: "这让（生物技术公司）主管们发狂般地焦躁不安。",
      ai: { backbone: "主语 Executives、谓语 were agitated、状语 violently", structure: ["副词 violently：作状语，表示“强烈地”"], collocations: ["be violently agitated（极度不安）"] }},
    { num: "⑤", en: "The Biotechnology Industry Organization (BIO), a trade group, assured members that this was just a “preliminary step” in a longer battle.", ref: "作为贸易团体，生物技术工业组织（BIO）向其成员承诺，这只是一场长期战争的“第一步”。",
      ai: { backbone: "主语 The Biotechnology Industry Organization (BIO)、谓语 assured、宾语 members、宾语从句 that this was just a “preliminary step”", structure: ["名词短语 a trade group：作同位语，说明 BIO 的性质","宾语从句 that this was just a “preliminary step” in a longer battle：作 assured 的宾语","介词短语 in a longer battle：说明在更长斗争中的地位"], collocations: ["assure sb. that（向某人保证）","a trade group（行业协会）","a preliminary step（初步的一步）","a longer battle（更持久的斗争）"] }},
    { num: "⑥", en: "On July 29th they were relieved, at least temporarily.", ref: "7 月 29 日，他们如释重负，至少暂时如此。",
      ai: { backbone: "主语 they、谓语 were relieved、状语 at least temporarily", structure: ["时间状语 On July 29th：说明时间","介词短语 at least temporarily：作状语，表示“至少暂时地”"], collocations: ["be relieved（如释重负）","at least temporarily（至少暂时）"] }},
    { num: "⑦", en: "A federal appeals court overturned the prior decision, ruling that Myriad Genetics could indeed hold patents to two genes that help forecast a woman’s risk of breast cancer.", ref: "联邦上诉法院推翻了先前判决，裁决 MyriadGenetics 公司的确可以拥有两项帮助预测女性乳腺癌风险的基因专利。",
      ai: { backbone: "主语 A federal appeals court、谓语 overturned、宾语 the prior decision", structure: ["现在分词短语 ruling that Myriad Genetics could indeed hold patents to two genes：作伴随状语，说明裁决内容","宾语从句 that Myriad Genetics could indeed hold patents to two genes：作 ruling 的宾语","定语从句 that help forecast a woman’s risk of breast cancer：修饰 two genes","不定式短语 forecast a woman’s risk：作 help 的宾语"], collocations: ["federal appeals court（联邦上诉法院）","overturn a decision（推翻裁决）","hold patents to（拥有……的专利）","forecast a risk（预测风险）","breast cancer（乳腺癌）"] }},
    { num: "⑧", en: "The chief executive of Myriad, a company in Utah, said the ruling was a blessing to firms and patients alike.", ref: "位于犹他州的Myriad 公司的执行总裁认为，这一裁决无论对于公司还是对于病人都是一种福音。",
      ai: { backbone: "主语 The chief executive of Myriad、谓语 said、宾语从句 the ruling was a blessing", structure: ["名词短语 a company in Utah：作同位语，说明 Myriad 的位置","宾语从句 the ruling was a blessing to firms and patients alike：作 said 的宾语","介词短语 to firms and patients alike：说明受益对象"], collocations: ["chief executive（首席执行官）","a blessing to（对……是福音）","firms and patients alike（公司和患者都一样）"] }}
    ]
  },
  {
    day: 140,
    type: "英二",
    source: "2012 Text 3",
    zh: "但随着公司继续对个性化医疗进行尝试，未来法庭仍然会相当忙碌。Myriad 案本身可能并未完结。批评者主要提出了三条反对基因专利的理由：基因是自然的产物，所以不可申请专利；基因专利抑制了创新而非奖励创新；专利垄断限制了人们对基因测试的使用，如对Myriad 基因测试的使用。似乎越来越多的人们趋于认同上述观点。去年，联邦专项小组敦促对基因检测方面的专利进行改革。十月，司法部针对 Myriad 案提交的案情摘要中提出，分离的 DNA 分子“就像从棉花籽中分离出的棉纤维一样，仅仅是自然的产物”。尽管上诉法庭已经做出了裁决，但重大问题依然悬而未决。例如，对一个完整基因组进行排序是否会侵犯其内部单个基因所获得的专利，这一问题尚不明朗。这一案件可能会上诉至最高法院。",
    sentences: [
    { num: "①", en: "But as companies continue their attempts at personalized medicine, the courts will remain rather busy.", ref: "但随着公司继续对个性化医疗进行尝试，未来法庭仍然会相当忙碌。",
      ai: { backbone: "主句：主语 the courts、谓语 will remain、表语 rather busy；时间状语从句 as companies continue their attempts", structure: ["转折连词 But：表转折","时间状语从句 as companies continue their attempts at personalized medicine：表示“随着……”","介词短语 at personalized medicine：说明尝试的对象"], collocations: ["continue one's attempts at（继续对……的尝试）","personalized medicine（个性化医疗）","remain busy（保持忙碌）"] }},
    { num: "②", en: "The Myriad case itself is probably not over.", ref: "Myriad 案本身可能并未完结。",
      ai: { backbone: "主语 The Myriad case itself、谓语 is、表语 probably not over", structure: ["代词 itself：作同位语，加强语气"], collocations: ["not over（尚未结束）"] }},
    { num: "③", en: "Critics make three main arguments against gene patents: a gene is a product of nature, so it may not be patented; gene patents suppress innovation rather than reward it; and patents’ monopolies restrict access to genetic tests such as Myriad’s.", ref: "批评者主要提出了三条反对基因专利的理由：基因是自然的产物，所以不可申请专利；基因专利抑制了创新而非奖励创新；专利垄断限制了人们对基因测试的使用，如对Myriad 基因测试的使用。",
      ai: { backbone: "主语 Critics、谓语 make、宾语 three main arguments", structure: ["介词短语 against gene patents：作后置定语，修饰 arguments","冒号后为三个并列观点：","a gene is a product of nature, so it may not be patented；","gene patents suppress innovation rather than reward it；","and patents’ monopolies restrict access to genetic tests such as Myriad’s"], collocations: ["make arguments against（提出反对……的论点）","a product of nature（自然产物）","suppress innovation（压制创新）","rather than（而不是）","patents' monopolies（专利垄断）","restrict access to（限制获得……）","genetic tests（基因检测）"] }},
    { num: "④", en: "A growing number seem to agree.", ref: "似乎越来越多的人们趋于认同上述观点。",
      ai: { backbone: "主语 A growing number、谓语 seem、不定式 to agree", structure: ["名词短语 a growing number：作主语（后省略 people）","介词短语 seem to agree：表示似乎都同意"], collocations: ["a growing number（越来越多的人）","seem to agree（似乎同意）"] }},
    { num: "⑤", en: "Last year a federal task-force urged reform for patents related to genetic tests.", ref: "去年，联邦专项小组敦促对基因检测方面的专利进行改革。",
      ai: { backbone: "主语 a federal task-force、谓语 urged、宾语 reform", structure: ["时间状语 Last year：说明时间","介词短语 for patents related to genetic tests：说明改革对象","过去分词短语 related to genetic tests：作后置定语，修饰 patents"], collocations: ["a federal task-force（联邦特别工作组）","urge reform（敦促改革）","be related to（与……相关）"] }},
    { num: "⑥", en: "In October the Department of Justice filed a brief in the Myriad case, arguing that an isolated DNA molecule “is no less a product of nature... than are cotton fibres that have been separated from cotton seeds. ”", ref: "十月，司法部针对 Myriad 案提交的案情摘要中提出，分离的 DNA 分子“就像从棉花籽中分离出的棉纤维一样，仅仅是自然的产物”。",
      ai: { backbone: "主句：主语 the Department of Justice、谓语 filed、宾语 a brief；时间状语 In October", structure: ["介词短语 in the Myriad case：说明案件","现在分词短语 arguing that an isolated DNA molecule “is no less a product of nature...”：作伴随状语","宾语从句 that an isolated DNA molecule “is no less a product of nature...than are cotton fibres that have been separated from cotton seeds.”：作 arguing 的宾语","定语从句 that have been separated from cotton seeds：修饰 cotton fibres"], collocations: ["the Department of Justice（司法部）","file a brief（提交法律意见书）","argue that（主张）","no less...than...（与……一样）","a product of nature（自然产物）","cotton seeds（棉籽）"] }},
    { num: "⑦", en: "Despite the appeals court’s decision, big questions remain unanswered.", ref: "尽管上诉法庭已经做出了裁决，但重大问题依然悬而未决。",
      ai: { backbone: "主句：主语 big questions、谓语 remain、表语 unanswered；让步状语 Despite the appeals court’s decision", structure: ["介词短语 Despite the appeals court’s decision：作让步状语"], collocations: ["despite（尽管）","remain unanswered（仍未得到解答）"] }},
    { num: "⑧", en: "For example, it is unclear whether the sequencing of a whole genome violates the patents of individual genes within it.", ref: "例如，对一个完整基因组进行排序是否会侵犯其内部单个基因所获得的专利，这一问题尚不明朗。",
      ai: { backbone: "it 为形式主语、谓语 is unclear、主语从句 whether the sequencing violates the patents", structure: ["插入语 For example：举例说明","主语从句 whether the sequencing of a whole genome violates the patents of individual genes within it：作真正主语"], collocations: ["it is unclear whether（……尚不清楚）","the sequencing of a whole genome（整个基因组测序）","violate patents（侵犯专利）","individual genes（单个基因）"] }},
    { num: "⑨", en: "The case may yet reach the Supreme Court.", ref: "这一案件可能会上诉至最高法院。",
      ai: { backbone: "主语 The case、谓语 may yet reach、宾语 the Supreme Court", structure: ["副词 yet：作状语，表示“尚未/终将”"], collocations: ["reach the Supreme Court（打到最高法院）"] }}
    ]
  },
  {
    day: 141,
    type: "英二",
    source: "2012 Text 3",
    zh: "然而，随着这一行业的发展，其他诉讼可能会产生更大影响。公司已不大可能就“人类 DNA分子”申请许多专利——大多数该类基因早已被申请专利，或是属于公共领域。各企业当前正在研究基因间如何相互作用，以寻找可能用于确定疾病诱因或预测药物疗效的关联物。来自 BIO 的律师 HansSauer 解释道，各企业正急于获取“连点”专利。他们能否成功可能取决于一起由 Mayo 诊所引发的相关案件，最高法院将于下一庭审期对这一案件进行听审。BIO 最近召开大会，开展一系列会议针对目前变换的专利情形对律师进行培训。每一场会议都座无虚席。",
    sentences: [
    { num: "①", en: "As the industry advances, however, other suits may have an even greater impact.", ref: "然而，随着这一行业的发展，其他诉讼可能会产生更大影响。",
      ai: { backbone: "主句：主语 other suits、谓语 may have、宾语 an even greater impact；时间状语从句 As the industry advances", structure: ["插入语 however：表转折","时间状语从句 As the industry advances：表示“随着行业的发展”","比较级 even greater：表示更大"], collocations: ["have an impact（产生影响）","advance（发展，推进）"] }},
    { num: "②", en: "Companies are unlikely to file many more patents for human DNA molecules—most are already patented or in the public domain.", ref: "公司已不大可能就“人类 DNA分子”申请许多专利——大多数该类基因早已被申请专利，或是属于公共领域。",
      ai: { backbone: "主语 Companies、谓语 are unlikely to file、宾语 more patents；原因状语 most are already patented or in the public domain", structure: ["不定式短语 to file many more patents for human DNA molecules：作表语","介词短语 for human DNA molecules：说明专利对象","破折号后的原因说明 most are already patented or in the public domain"], collocations: ["be unlikely to do（不太可能做某事）","file patents（申请专利）","human DNA molecules（人类DNA分子）","the public domain（公共领域）"] }},
    { num: "③", en: "Firms are now studying how genes interact, looking for correlations that might be used to determine the causes of disease or predict a drug’s efficacy.", ref: "各企业当前正在研究基因间如何相互作用，以寻找可能用于确定疾病诱因或预测药物疗效的关联物。",
      ai: { backbone: "主语 Firms、谓语 are studying、宾语从句 how genes interact", structure: ["时间状语 now：作状语","宾语从句 how genes interact：作 studying 的宾语","现在分词短语 looking for correlations：作伴随状语","定语从句 that might be used to determine the causes of disease or predict a drug’s efficacy：修饰 correlations","不定式短语 determine the causes of disease：作目的状语","不定式短语 predict a drug’s efficacy：与 determine 并列"], collocations: ["genes interact（基因相互作用）","look for correlations（寻找相关性）","determine the causes of disease（确定疾病成因）","predict a drug's efficacy（预测药效）"] }},
    { num: "④", en: "Companies are eager to win patents for “connecting the dots”, explains Hans Sauer, a lawyer for the BIO.", ref: "来自 BIO 的律师 HansSauer 解释道，各企业正急于获取“连点”专利。",
      ai: { backbone: "主句：主语 Companies、谓语 are eager to win、宾语 patents；宾语从句 for “connecting the dots”", structure: ["介词短语 for “connecting the dots”：说明专利内容","插入语 explains Hans Sauer, a lawyer for the BIO：说明信息来源","动名词短语 connecting the dots：作介词 for 的宾语"], collocations: ["be eager to do（渴望做某事）","win patents for（赢得……的专利）","connect the dots（串联线索，找出联系）"] }},
    { num: "⑤", en: "Their success may be determined by a suit related to this issue, brought by the Mayo Clinic, which the Supreme Court will hear in its next term.", ref: "他们能否成功可能取决于一起由 Mayo 诊所引发的相关案件，最高法院将于下一庭审期对这一案件进行听审。",
      ai: { backbone: "主语 Their success、谓语 may be determined、状语 by a suit；过去分词短语 brought by the Mayo Clinic", structure: ["介词短语 by a suit：引出决定者","过去分词短语 brought by the Mayo Clinic：作后置定语，修饰 suit","非限制性定语从句 which the Supreme Court will hear in its next term：修饰 suit"], collocations: ["be determined by（由……决定）","the Mayo Clinic（梅奥诊所）","hear a suit（审理案件）","next term（下一个开庭期）"] }},
    { num: "⑥", en: "The BIO recently held a convention which included sessions to coach lawyers on the shifting landscape for patents.", ref: "BIO 最近召开大会，开展一系列会议针对目前变换的专利情形对律师进行培训。",
      ai: { backbone: "主语 The BIO、谓语 held、宾语 a convention；定语从句 which included sessions", structure: ["时间状语 recently：说明时间","定语从句 which included sessions to coach lawyers on the shifting landscape for patents：修饰 convention","不定式短语 to coach lawyers：作后置定语，修饰 sessions","介词短语 on the shifting landscape：说明指导内容"], collocations: ["hold a convention（召开大会）","coach lawyers（指导律师）","the shifting landscape（不断变化的情形）"] }},
    { num: "⑦", en: "Each meeting was packed.", ref: "每一场会议都座无虚席。",
      ai: { backbone: "主语 Each meeting、谓语 was、表语 packed", structure: ["副词 packed：表示“座无虚席”"], collocations: ["be packed（座无虚席）"] }}
    ]
  },
  {
    day: 142,
    type: "英二",
    source: "2012 Text 4",
    zh: "大衰退也许结束了，但高失业率时代很有可能才刚刚开始。在它结束之前，它将很可能改变年轻一代的生活轨迹及其性格。而且它最终可能会在未来许多年重塑我们的政治、文化以及社会特征。在这场全国性的经济灾难中，没有人比失业者更努力地在寻找一线希望。许多人说，尽管失业极其痛苦，但是它以某些方式使人进步；自己变得不再那么贪图物质享乐，而且在经济问题上更加审慎；自己比过去更能体会到别人的艰辛。在有限的几个方面，也许大萧条将使得整个社会变得更好。至少它将我们从“一夜暴富和豪宅”的民族热梦中唤醒，并且给挥金如土的个人消费时代画上了一个必要的句号。",
    sentences: [
    { num: "①", en: "The great recession may be over, but this era of high joblessness is probably beginning.", ref: "大衰退也许结束了，但高失业率时代很有可能才刚刚开始。",
      ai: { backbone: "并列句：句1 主语 The great recession、谓语 may be over；句2 主语 this era of high joblessness、谓语 is probably beginning", structure: ["转折连词 but：表转折","介词短语 of high joblessness：作后置定语，修饰 era","副词 probably：作状语"], collocations: ["the great recession（大衰退）","be over（结束）","an era of high joblessness（高失业率的时代）"] }},
    { num: "②", en: "Before it ends, it will likely change the life course and character of a generation of young adults.", ref: "在它结束之前，它将很可能改变年轻一代的生活轨迹及其性格。",
      ai: { backbone: "主句：主语 it、谓语 will likely change、宾语 the life course and character；时间状语 Before it ends", structure: ["时间状语从句 Before it ends：说明时间","介词短语 of a generation of young adults：作后置定语，修饰 life course and character"], collocations: ["the life course（人生轨迹）","young adults（年轻人）","change the character（改变特质）"] }},
    { num: "③", en: "And ultimately, it is likely to reshape our politics, our culture, and the character of our society for years.", ref: "而且它最终可能会在未来许多年重塑我们的政治、文化以及社会特征。",
      ai: { backbone: "主语 it、谓语 is likely to reshape、宾语 our politics, our culture, and the character of our society", structure: ["副词 ultimately：作评注性状语，表示“最终”","介词短语 for years：说明持续影响的时间"], collocations: ["be likely to do（很可能做某事）","reshape（重塑）","the character of our society（我们社会的特质）"] }},
    { num: "④", en: "No one tries harder than the jobless to find silver linings in this national economic disaster.", ref: "在这场全国性的经济灾难中，没有人比失业者更努力地在寻找一线希望。",
      ai: { backbone: "主语 No one、谓语 tries harder、状语 than the jobless；目的状语 to find silver linings", structure: ["介词短语 than the jobless：作比较状语","不定式短语 to find silver linings：作目的状语","介词短语 in this national economic disaster：说明在何种处境中寻找"], collocations: ["try harder（更加努力）","find silver linings（寻找一线希望）","national economic disaster（全国性的经济灾难）"] }},
    { num: "⑤", en: "Many said that unemployment, while extremely painful, had improved them in some ways: they had become less materialistic and more financially prudent; they were more aware of the struggles of others.", ref: "许多人说，尽管失业极其痛苦，但是它以某些方式使人进步；自己变得不再那么贪图物质享乐，而且在经济问题上更加审慎；自己比过去更能体会到别人的艰辛。",
      ai: { backbone: "主语 Many、谓语 said、宾语从句 that unemployment had improved them", structure: ["宾语从句 that unemployment, while extremely painful, had improved them in some ways：作 said 的宾语","插入让步 while extremely painful：表示“尽管极其痛苦”","介词短语 in some ways：说明在某些方面","冒号后为并列说明 they had become less materialistic and more financially prudent; they were more aware of the struggles of others"], collocations: ["extremely painful（极其痛苦）","improve sb. in some ways（在某些方面改善某人）","less materialistic（不那么物质化的）","financially prudent（财务上审慎的）","be aware of（意识到）","the struggles of others（他人的艰辛）"] }},
    { num: "⑥", en: "In limited respects, perhaps the recession will leave society better off.", ref: "在有限的几个方面，也许大萧条将使得整个社会变得更好。",
      ai: { backbone: "主句：主语 the recession、谓语 will leave、宾语 society、宾补 better off；状语 In limited respects", structure: ["介词短语 In limited respects：作状语，表示“在有限方面”","副词 perhaps：作评注性状语"], collocations: ["in limited respects（在有限的方面）","leave sb. better off（使某人境况更好）"] }},
    { num: "⑦", en: "At the very least, it has awoken us from our national fever dream of easy riches and bigger houses, and put a necessary end to an era of reckless personal spending.", ref: "至少它将我们从“一夜暴富和豪宅”的民族热梦中唤醒，并且给挥金如土的个人消费时代画上了一个必要的句号。",
      ai: { backbone: "主句：主语 it、谓语 has awoken、宾语 us、宾补 from our national fever dream；并列谓语 and put a necessary end to an era", structure: ["介词短语 At the very least：作评注性状语，表示“至少”","介词短语 of easy riches and bigger houses：作后置定语，修饰 fever dream","并列谓语 and put a necessary end to an era of reckless personal spending：与 has awoken 并列"], collocations: ["at the very least（至少）","a fever dream of（关于……的白日梦）","easy riches（轻松致富）","put an end to（结束）","reckless personal spending（不计后果的个人消费）"] }}
    ]
  },
  {
    day: 143,
    type: "英二",
    source: "2012 Text 4",
    zh: "然而对于大多数情况而言，这些好处似乎是微乎其微、未知且遥远的。在《经济增长的道德影响》一书中，经济历史学家本杰明·弗里德曼认为，美国国内外所经历的长期经济停滞或衰退几乎总是使社会变得更为狭隘、包容性更弱，而且往往使权利与自由的发展止步不前或逆向而行。反移民情绪往往会加剧，正如种族和阶级间矛盾一样。",
    sentences: [
    { num: "①", en: "But for the most part, these benefits seem thin, uncertain, and far off.", ref: "然而对于大多数情况而言，这些好处似乎是微乎其微、未知且遥远的。",
      ai: { backbone: "主语 these benefits、谓语 seem、表语 thin, uncertain, and far off", structure: ["介词短语 But for the most part：作状语，表示“但在很大程度上”","并列表语 thin, uncertain, and far off"], collocations: ["for the most part（在很大程度上）","thin, uncertain, and far off（微薄、不确定且遥远）"] }},
    { num: "②", en: "In The Moral Consequences of Economic Growth, the economic historian Benjamin Friedman argues that both inside and outside the U.S., lengthy periods of economic stagnation or decline have almost always left society more mean-spirited and less inclusive, and have usually stopped or reversed the advance of rights and freedoms.", ref: "在《经济增长的道德影响》一书中，经济历史学家本杰明·弗里德曼认为，美国国内外所经历的长期经济停滞或衰退几乎总是使社会变得更为狭隘、包容性更弱，而且往往使权利与自由的发展止步不前或逆向而行。",
      ai: { backbone: "主句：主语 the economic historian Benjamin Friedman、谓语 argues、宾语从句 that lengthy periods have left society more mean-spirited", structure: ["介词短语 In The Moral Consequences of Economic Growth：说明出处","宾语从句 that both inside and outside the U.S., lengthy periods of economic stagnation or decline have almost always left society more mean-spirited and less inclusive, and have usually stopped or reversed the advance of rights and freedoms：作 argues 的宾语","介词短语 both inside and outside the U.S.：说明范围","介词短语 of economic stagnation or decline：作后置定语，修饰 periods","并列谓语 have usually stopped or reversed the advance：与 have left 并列"], collocations: ["economic stagnation（经济停滞）","mean-spirited（心胸狭隘的）","less inclusive（更缺乏包容性的）","stop or reverse（阻止或逆转）","the advance of rights and freedoms（权利和自由的进步）"] }},
    { num: "③", en: "Anti-immigrant sentiment typically increases, as does conflict between races and classes.", ref: "反移民情绪往往会加剧，正如种族和阶级间矛盾一样。",
      ai: { backbone: "主语 Anti-immigrant sentiment、谓语 typically increases；并列比较 as does conflict between races and classes", structure: ["副词 typically：作状语","倒装结构 as does conflict：表示“……也是如此”","介词短语 between races and classes：作后置定语，修饰 conflict"], collocations: ["anti-immigrant sentiment（反移民情绪）","typically increases（通常增加）","conflict between races and classes（种族和阶级冲突）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "anti-immigrantadj.反移民的", word: "anti-immigrant", meaning: "adj.反移民的" },
      { raw: "sentimentn.观点，情绪", word: "sentiment", meaning: "n.观点，情绪" },
      { raw: "typicallyadv.通常", word: "typically", meaning: "adv.通常" },
      { raw: "conflictn.矛盾", word: "conflict", meaning: "n.矛盾" },
      { raw: "racen.种族", word: "race", meaning: "n.种族" },
      { raw: "classn.阶级", word: "class", meaning: "n.阶级" }
    ],
        split: "Anti-immigrantsentimenttypicallyincreases,//asdoesconflict//betweenracesand classes.",
        grammar: ["主干：主+谓", "主干结构提炼：Anti-immigrantsentimentincreases", "注意本句中单词的熟词僻义（typically/race/class）", "as引导状语从句，此处为倒装+省略结构"],
        ref: ""
      }
    ]
  },
  {
    day: 144,
    type: "英二",
    source: "2012 Text 4",
    zh: "经济衰退时期的收入差距往往会有所缩小，但这一次例外。的确，此次经济疲软阶段可能加深阶级隔阂，减少阶级隔阂弥合的机会——对于年轻人来说更是如此。哥伦比亚大学经济学家蒂尔·冯·瓦赫特的研究表明，不是所有在衰退期毕业的人都会觉得人生机会黯淡：那些毕业于名牌大学的人会相当快地赶上如果他们是在经济繁荣时期毕业本会达到的位置；而落在后面的是那些不如他们的普通大众。",
    sentences: [
    { num: "①", en: "Income inequality usually falls during a recession, but it has not shrunk in this one.", ref: "经济衰退时期的收入差距往往会有所缩小，但这一次例外。",
      ai: { backbone: "并列句：句1 主语 Income inequality、谓语 usually falls；句2 主语 it、谓语 has not shrunk", structure: ["介词短语 during a recession：说明时间","转折连词 but：表转折","介词短语 in this one：说明在这轮衰退中"], collocations: ["income inequality（收入不平等）","during a recession（在经济衰退期间）","shrink（缩小）"] }},
    { num: "②", en: "Indeed, this period of economic weakness may reinforce class divides, and decrease opportunities to cross them — especially for young people.", ref: "的确，此次经济疲软阶段可能加深阶级隔阂，减少阶级隔阂弥合的机会——对于年轻人来说更是如此。",
      ai: { backbone: "主句：主语 this period of economic weakness、谓语 may reinforce、宾语 class divides；并列谓语 and decrease opportunities", structure: ["副词 Indeed：作评注性状语","介词短语 to cross them：作后置定语，修饰 opportunities","插入补充 especially for young people：说明受影响最大的人群"], collocations: ["economic weakness（经济疲软）","reinforce class divides（加剧阶级分化）","decrease opportunities（减少机会）","cross divides（跨越鸿沟）"] }},
    { num: "③", en: "The research of Till Von Wachter, the economist at Columbia University, suggests that not all people graduating into a recession see their life chances dimmed: those with degrees from elite universities catch up fairly quickly to where they otherwise would have been if they had graduated in better times;", ref: "哥伦比亚大学经济学家蒂尔·冯·瓦赫特的研究表明，不是所有在衰退期毕业的人都会觉得人生机会黯淡：那些毕业于名牌大学的人会相当快地赶上如果他们是在经济繁荣时期毕业本会达到的位置；",
      ai: { backbone: "主语 The research of Till Von Wachter、谓语 suggests、宾语从句 that not all people graduating into a recession see their life chances dimmed", structure: ["名词短语 the economist at Columbia University：作同位语，说明 Till Von Wachter 的身份","宾语从句 that not all people graduating into a recession see their life chances dimmed：作 suggests 的宾语","现在分词短语 graduating into a recession：作后置定语，修饰 people","宾语补足语 dimmed：说明人生机遇被蒙上阴影","分号后为补充说明 those with degrees from elite universities catch up fairly quickly to where they otherwise would have been if they had graduated in better times"], collocations: ["graduate into a recession（在衰退期毕业）","life chances（人生际遇）","catch up to（赶上）","elite universities（精英大学）","graduate in better times（在更好的时期毕业）"] }},
    { num: "④", en: "it is the masses beneath them that are left behind.", ref: "而落在后面的是那些不如他们的普通大众。",
      ai: { backbone: "强调句型：it is the masses beneath them that are left behind", structure: ["强调句型 it is...that...：强调主语 the masses","介词短语 beneath them：作后置定语，修饰 masses","被动语态 are left behind：表示被抛在后面"], collocations: ["the masses beneath（下面的大众）","be left behind（被落下，被抛在后面）"] }}
    ]
  },
  {
    day: 145,
    type: "英二",
    source: "2012 Text 4",
    zh: "因特网时代，了解深藏于美国社会内部的怨气格外容易。当前难的是去弄清楚这些艰苦岁月究竟如何影响社会特征。在许多方面，步入经济萧条期的美国在社会问题上比历史上任何时期都更为宽容，而且从萧条开始时期，各种关于社会矛盾方面的全国性民意调查就显示出不同的结果。这些艰苦日子到底将如何重塑我们的社会结构，我们只能继续观望。但可以确定的是，它们一定会使社会结构得到重组，而且不利时期持续越久，重组的程度就越甚。",
    sentences: [
    { num: "①", en: "In the Internet age, it is particularly easy to see the resentment that has always been hidden within American society.", ref: "因特网时代，了解深藏于美国社会内部的怨气格外容易。",
      ai: { backbone: "主句：主语 it、谓语 is、表语 particularly easy、不定式 to see the resentment；时间状语 In the Internet age", structure: ["介词短语 In the Internet age：作时间状语","不定式短语 to see the resentment：作真正主语","定语从句 that has always been hidden within American society：修饰 the resentment"], collocations: ["the Internet age（互联网时代）","be hidden within（隐藏于……之中）","see the resentment（看到不满）"] }},
    { num: "②", en: "More difficult, in the moment, is discerning precisely how these lean times are affecting society’s character.", ref: "当前难的是去弄清楚这些艰苦岁月究竟如何影响社会特征。",
      ai: { backbone: "主句：主语 discerning precisely how these lean times are affecting society’s character、谓语 is、表语 More difficult；时间状语 in the moment", structure: ["比较级 More difficult：表示“更困难”","介词短语 in the moment：作时间状语","动名词短语 discerning precisely how...：作主语","宾语从句 how these lean times are affecting society’s character：作 discerning 的宾语"], collocations: ["in the moment（在当下）","lean times（艰难时期）","affect society's character（影响社会特质）"] }},
    { num: "③", en: "In many respects, the U.S. was more socially tolerant entering this recession than at any time in its history, and a variety of national polls on social conflict since then have shown mixed results.", ref: "在许多方面，步入经济萧条期的美国在社会问题上比历史上任何时期都更为宽容，而且从萧条开始时期，各种关于社会矛盾方面的全国性民意调查就显示出不同的结果。",
      ai: { backbone: "主句：主语 the U.S.、谓语 was、表语 more socially tolerant；介词短语 entering this recession", structure: ["介词短语 In many respects：作评注性状语，表示“在许多方面”","现在分词短语 entering this recession：作时间状语","比较状语 than at any time in its history：说明比较对象","并列分句 and a variety of national polls on social conflict since then have shown mixed results"], collocations: ["in many respects（在许多方面）","socially tolerant（社会包容的）","at any time in its history（在其历史的任何时候）","a variety of（各种各样的）","national polls（全国性民调）","mixed results（好坏参半的结果）"] }},
    { num: "④", en: "We will have to wait and see exactly how these hard times will reshape our social fabric.", ref: "这些艰苦日子到底将如何重塑我们的社会结构，我们只能继续观望。",
      ai: { backbone: "主语 We、谓语 will have to wait and see、宾语从句 exactly how these hard times will reshape our social fabric", structure: ["并列谓语 wait and see","宾语从句 exactly how these hard times will reshape our social fabric：作 see 的宾语"], collocations: ["wait and see（拭目以待）","hard times（艰难时期）","reshape the social fabric（重塑社会结构）"] }},
    { num: "⑤", en: "But they certainly will reshape it, and all the more so the longer they extend.", ref: "但可以确定的是，它们一定会使社会结构得到重组，而且不利时期持续越久，重组的程度就越甚。",
      ai: { backbone: "主句：主语 they、谓语 will reshape、宾语 it；转折并列句 but all the more so the longer they extend", structure: ["转折连词 But：表转折","副词 certainly：作状语","比较结构 the longer they extend：表示“延续越久越是如此”"], collocations: ["reshape（重塑）","all the more so（更加如此）","extend（延续）"] }}
    ]
  },
  {
    day: 146,
    type: "英二",
    source: "2013 Text 1",
    zh: "《在美国制造》一文中，作者亚当·戴维森讲述了一个来自棉花产地、有关现代纺织厂自动化到达何种程度的笑话：普通纺织厂如今只有两名员工，“一个人和一只狗。人负责喂狗，而狗负责让人远离机器。”戴维森此文只不过是新近涌现的诸多同类文章中的一篇，这些文章都提出这样一种观点：当前失业率居高不下以及中产阶级收入缩水，很大程度上是由于大萧条造成的需求大幅降低，但同时也由于全球化和信息技术革命的发展，这种发展使机器或外来雇工取代劳力的速度超过了以往任何时期。",
    sentences: [
    { num: "①", en: "In an essay entitled “Making It in America,” the author Adam Davidson relates a joke from cotton country about just how much a modern textile mill has been automated: The average mill has only two employees today, “a man and a dog.", ref: "《在美国制造》一文中，作者亚当·戴维森讲述了一个来自棉花产地、有关现代纺织厂自动化到达何种程度的笑话：普通纺织厂如今只有两名员工，“一个人和一只狗。",
      ai: { backbone: "主句：主语 the author Adam Davidson、谓语 relates、宾语 a joke；介词短语 from cotton country", structure: ["介词短语 In an essay entitled “Making It in America,”：作状语，说明出处","过去分词短语 entitled “Making It in America”：作后置定语，修饰 essay","介词短语 about just how much a modern textile mill has been automated：作后置定语，修饰 joke","宾语从句 how much a modern textile mill has been automated：作介词 about 的宾语","冒号后为补充说明 The average mill has only two employees today, “a man and a dog.”"], collocations: ["entitled（题为……的）","relate a joke（讲述一个笑话）","cotton country（棉花产区）","a modern textile mill（现代化纺织厂）","be automated（自动化）"] }},
    { num: "②", en: "The man is there to feed the dog, and the dog is there to keep the man away from the machines.”", ref: "人负责喂狗，而狗负责让人远离机器。”",
      ai: { backbone: "并列句：句1 主语 The man、谓语 is there、目的状语 to feed the dog；句2 主语 the dog、谓语 is there、目的状语 to keep the man away from the machines", structure: ["不定式短语 to feed the dog：作目的状语","不定式短语 to keep the man away from the machines：作目的状语","介词短语 away from the machines：说明保持距离的对象"], collocations: ["feed the dog（喂狗）","keep sb. away from（使某人远离……）"] }},
    { num: "③", en: "Davidson’s article is one of a number of pieces that have recently appeared making the point that the reason we have such stubbornly high unemployment and declining middle-class incomes today is largely because of the big drop in demand because of the Great Recession, but it is also because of the advances in both globalization and the information technology revolution, which are more rapidly than ever replacing labor with machines or foreign workers.", ref: "戴维森此文只不过是新近涌现的诸多同类文章中的一篇，这些文章都提出这样一种观点：当前失业率居高不下以及中产阶级收入缩水，很大程度上是由于大萧条造成的需求大幅降低，但同时也由于全球化和信息技术革命的发展，这种发展使机器或外来雇工取代劳力的速度超过了以往任何时期。",
      ai: { backbone: "主语 Davidson’s article、谓语 is、表语 one of a number of pieces", structure: ["定语从句 that have recently appeared making the point：修饰 pieces","现在分词短语 making the point：作伴随状语","同位语从句 that the reason we have such stubbornly high unemployment and declining middle-class incomes today is largely because of the big drop in demand because of the Great Recession, but it is also because of the advances in both globalization and the information technology revolution：解释说明 the point","定语从句 we have such stubbornly high unemployment：修饰 the reason（省略了关系代词 why）","原因状语 because of the big drop in demand：说明原因","原因状语 because of the advances：说明另一原因","非限制性定语从句 which are more rapidly than ever replacing labor with machines or foreign workers：修饰 globalization and the information technology revolution"], collocations: ["make the point that（指出……这一点）","stubbornly high unemployment（居高不下的失业率）","declining middle-class incomes（不断下降的中产阶级收入）","the big drop in demand（需求的大幅下降）","the Great Recession（大衰退）","the information technology revolution（信息技术革命）","replace labor with（用……取代劳动力）","more rapidly than ever（比以往更快地）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "stubbornlyadv.难以去除地，难以对付地", word: "stubbornly", meaning: "adv.难以去除地，难以对付地" },
      { raw: "revolutionn.彻底变革，革命", word: "revolution", meaning: "n.彻底变革，革命" },
      { raw: "theGreatRecession经济大萧条", word: "theGreatRecession经济大萧条", meaning: "" },
      { raw: "replaceAwithB用B替换A", word: "replaceAwithB用B替换A", meaning: "" }
    ],
        split: "Davidson’sarticleisoneofanumberofpieces//thathaverecentlyappeared makingthepoint//thatthereason//(that)wehavesuchstubbornlyhigh unemployment//anddecliningmiddle-classincomestodayislargely//becauseofthe bigdrop//indemand//becauseoftheGreatRecession,//butitisalsobecauseofthe advances//inbothglobalization//andtheinformationtechnologyrevolution,//which are(morerapidlythanever)replacinglabor//withmachinesorforeignworkers.",
        grammar: ["主干：主+系+表", "主干结构提炼：Davidson’sarticleisoneofanumberofpieces", "同位语从句主干结构提炼：thereasonisbecauseofA,butitisalsobecauseofB", "第1个that引导定语从句（修饰pieces）", "第2个that引导同位语从句（解释point）", "reason后省略连接词that，引导定语从句（修饰reason）", "indemand是后置定语（修饰bigdrop）", "becauseoftheGreatRecession是后置定语（修饰demand）", "inbothglobalization...revolution是后置定语（修饰advances）", "which引导非限制性定语从句，“morerapidlythanever”是状语"],
        ref: "戴维森此文只不过是新近涌现的诸多同类文章中的一篇，这些文章都提出这样一种观点：当前失业率居高不下以及中产阶级收入缩水，很大程度上是由于大萧条造成的需求大幅降低，但同时也由于全球化和信息技术革命的发展，这种发展使机器或外来雇工取代劳力的速度超过了以往任何时期。"
      }
    ]
  },
  {
    day: 147,
    type: "英二",
    source: "2013 Text 1",
    zh: "过去，劳动者拥有一般技能，干一份普通工作，就能过上普通生活。但是现在，“平庸已正式结束。表现平平完全无法再让你过上普通生活了。当如此多得多的雇主有着如此多得多的渠道获取如此多得多中等以上水平的廉价外国劳力、廉价机器人、廉价软件、廉价自动装置以及廉价天才的时候，表现普通将难以立足。因此，所有人都需要找到自身的额外价值——一种可以令其在各种工作领域中脱颖而出的独特价值贡献。的确，新技术一直在吞噬工作岗位，而且将永远持续下去。不过速度一直在加快。正如戴维森所言，“2009 年以前的十年间，（美国）工厂裁员如此之快，以至于抹掉了前 70 年所有新增员工的总额；制造业岗位中，大约有三分之一，共计将近 600 万个岗位不复存在。”",
    sentences: [
    { num: "①", en: "In the past, workers with average skills, doing an average job, could earn an average lifestyle.", ref: "过去，劳动者拥有一般技能，干一份普通工作，就能过上普通生活。",
      ai: { backbone: "主句：主语 workers、谓语 could earn、宾语 an average lifestyle；时间状语 In the past", structure: ["介词短语 with average skills：作后置定语，修饰 workers","现在分词短语 doing an average job：作后置定语，修饰 workers"], collocations: ["in the past（在过去）","average skills（中等技能）","earn a lifestyle（谋得一种生活水准）"] }},
    { num: "②", en: "But, today, average is officially over.", ref: "但是现在，“平庸已正式结束。",
      ai: { backbone: "主语 average、谓语 is、表语 officially over", structure: ["转折连词 But：表转折","副词 officially：作状语，表示“正式地”"], collocations: ["officially over（正式结束）"] }},
    { num: "③", en: "Being average just won’t earn you what it used to.", ref: "表现平平完全无法再让你过上普通生活了。",
      ai: { backbone: "主语 Being average、谓语 won’t earn、宾语 you、宾补 what it used to", structure: ["动名词短语 Being average：作主语","宾语从句 what it used to：作 earn 的间接宾语内容","不定式省略（what it used to earn）"], collocations: ["being average（甘于平庸）","what it used to（过去所能获得的）"] }},
    { num: "④", en: "It can’t when so many more employers have so much more access to so much more above average cheap foreign labor, cheap robotics, cheap software, cheap automation and cheap genius.", ref: "当如此多得多的雇主有着如此多得多的渠道获取如此多得多中等以上水平的廉价外国劳力、廉价机器人、廉价软件、廉价自动装置以及廉价天才的时候，表现普通将难以立足。",
      ai: { backbone: "主句：主语 it、谓语 can’t；原因状语从句 when so many more employers have access", structure: ["原因状语从句 when so many more employers have so much more access to so much more above average cheap foreign labor, cheap robotics, cheap software, cheap automation and cheap genius：说明原因","介词短语 to so much more above average cheap foreign labor...：与 have access 搭配","并列宾语 cheap foreign labor, cheap robotics, cheap software, cheap automation and cheap genius"], collocations: ["have access to（能够获得）","above average（高于平均水平的）","cheap foreign labor（廉价的外国劳动力）","cheap robotics（廉价的机器人技术）"] }},
    { num: "⑤", en: "Therefore, everyone needs to find their extra — their unique value contribution that makes them stand out in whatever is their field of employment.", ref: "因此，所有人都需要找到自身的额外价值——一种可以令其在各种工作领域中脱颖而出的独特价值贡献。",
      ai: { backbone: "主句：主语 everyone、谓语 needs to find、宾语 their extra；原因/补充说明", structure: ["副词 Therefore：作评注性状语，表示“因此”","破折号后的名词短语 their unique value contribution：作 their extra 的同位语","定语从句 that makes them stand out：修饰 contribution","介词短语 in whatever is their field of employment：说明领域"], collocations: ["unique value contribution（独特的价值贡献）","stand out（脱颖而出）","field of employment（职业领域）"] }},
    { num: "⑥", en: "Yes, new technology has been eating jobs forever, and always will.", ref: "的确，新技术一直在吞噬工作岗位，而且将永远持续下去。",
      ai: { backbone: "主句：主语 new technology、谓语 has been eating、宾语 jobs；时间状语 forever", structure: ["插入语 Yes：作评注性状语","并列谓语 and always will（省略 eat jobs）"], collocations: ["eat jobs（吞噬就业岗位）","forever and always（永远如此）"] }},
    { num: "⑦", en: "But there’s been an acceleration.", ref: "不过速度一直在加快。",
      ai: { backbone: "主语 there、谓语 has been、表语 an acceleration", structure: ["转折连词 But：表转折"], collocations: ["an acceleration（加速）"] }},
    { num: "⑧", en: "As Davidson notes, “In the 10 years ending in 2009, [U.S.] factories shed workers so fast that they erased almost all the gains of the previous 70 years; roughly one out of every three manufacturing jobs—about 6 million in total—disappeared.”", ref: "正如戴维森所言，“2009 年以前的十年间，（美国）工厂裁员如此之快，以至于抹掉了前 70 年所有新增员工的总额；制造业岗位中，大约有三分之一，共计将近 600 万个岗位不复存在。”",
      ai: { backbone: "主句：主语 [U.S.] factories、谓语 shed、宾语 workers；时间状语从句 As Davidson notes", structure: ["时间状语从句 As Davidson notes：说明信息来源","介词短语 In the 10 years ending in 2009：说明时间范围","现在分词短语 ending in 2009：作后置定语，修饰 years","结果状语从句 so fast that they erased almost all the gains：说明速度之快","时间状语 of the previous 70 years：说明对应时段","分号后的补充说明 roughly one out of every three manufacturing jobs—about 6 million in total—disappeared"], collocations: ["shed workers（裁减工人）","erase gains（抹掉成果）","one out of every three（每三个中有一个）","manufacturing jobs（制造业岗位）","in total（总计）"] }}
    ],
    analysis: [
      {
        sentNum: "⑤",
        vocab: [
      { raw: "extran.额外的东西，多余的部分（过人之处/额外优势）", word: "extra", meaning: "n.额外的东西，多余的部分（过人之处/额外优势）" },
      { raw: "uniqueadj.独一无二的，独特的", word: "unique", meaning: "adj.独一无二的，独特的" },
      { raw: "contributionn.贡献", word: "contribution", meaning: "n.贡献" },
      { raw: "employmentn.工作，就业", word: "employment", meaning: "n.工作，就业" },
      { raw: "standout脱颖而出", word: "standout脱颖而出", meaning: "" }
    ],
        split: "Therefore,everyoneneedstofindtheirextra—theiruniquevaluecontribution//that makesthemstandout//inwhateveristheirfieldofemployment.",
        grammar: ["主干：主+谓+宾", "破折号后theiruniquevaluecontribution是同位语（解释thereextra）", "that引导定语从句（修饰valuecontribution）", "makesb.dosth.让/使某人做某事", "whatever引导宾语从句，作介词in的宾语，whatever=anythingthat"],
        ref: "因此，所有人都需要找到自身的额外价值---一种可以令其在各种工作领域中脱颖而出的独特价值贡献。"
      }
    ]
  },
  {
    day: 148,
    type: "英二",
    source: "2013 Text 1",
    zh: "变化将会永远存在——新岗位，新产品，新服务。但有一点我们确信无疑，随着全球化和信息技术革命的发展，最佳岗位将要求员工掌握更多更好的教育以使自己超越平庸。在一个已正式告别平庸的世界里，我们需要做很多事情以扶持就业，但对 21 世纪来讲，最重要的事情莫过于出台《美国退伍军人权利法案》之类的法案，以确保每个美国人都有机会接受高中后教育。",
    sentences: [
    { num: "①", en: "There will always be change — new jobs, new products, new services.", ref: "变化将会永远存在——新岗位，新产品，新服务。",
      ai: { backbone: "主语 There、谓语 will always be、表语 change", structure: ["破折号后的 new jobs, new products, new services：作 change 的同位语，具体列举"], collocations: ["there will always be（永远会有）"] }},
    { num: "②", en: "But the one thing we know for sure is that with each advance in globalization and the I. T. revolution, the best jobs will require workers to have more and better education to make themselves above average.", ref: "但有一点我们确信无疑，随着全球化和信息技术革命的发展，最佳岗位将要求员工掌握更多更好的教育以使自己超越平庸。",
      ai: { backbone: "主句：主语 the best jobs、谓语 will require、宾语 workers、宾补 to have more and better education；定语从句 that we know for sure", structure: ["转折连词 But：表转折","定语从句 that we know for sure：修饰 the one thing（省略了关系代词）","介词短语 with each advance in globalization and the I. T. revolution：说明伴随条件","不定式短语 to make themselves above average：作目的状语","介词短语 above average：说明目标状态"], collocations: ["for sure（确定）","require sb. to do（要求某人做某事）","make oneself above average（使自己超越平均水平）","with each advance（随着每一次进步）"] }},
    { num: "③", en: "In a world where average is officially over, there are many things we need to do to support employment, but nothing would be more important than passing some kind of G. I. Bill for the 21st century that ensures that every American has access to post-high school education.", ref: "在一个已正式告别平庸的世界里，我们需要做很多事情以扶持就业，但对 21 世纪来讲，最重要的事情莫过于出台《美国退伍军人权利法案》之类的法案，以确保每个美国人都有机会接受高中后教育。",
      ai: { backbone: "主句：主语 there、谓语 are、表语 many things；定语从句 we need to do", structure: ["介词短语 In a world where average is officially over：作地点状语","定语从句 where average is officially over：修饰 world","转折并列句 but nothing would be more important than passing some kind of G. I. Bill：强调最重要的事","介词短语 for the 21st century：说明时代","定语从句 that ensures that every American has access to post-high school education：修饰 G. I. Bill"], collocations: ["support employment（支持就业）","nothing would be more important than（没有什么比……更重要）","G. I. Bill（《退伍军人权利法案》）","have access to（能够获得）","post-high school education（高中后教育）"] }}
    ],
    analysis: [
      {
        sentNum: "③",
        vocab: [
      { raw: "averagen.平均水平", word: "average", meaning: "n.平均水平" },
      { raw: "billn.法案", word: "bill", meaning: "n.法案" },
      { raw: "ensurev.确保", word: "ensure", meaning: "v.确保" },
      { raw: "haveaccessto有机会.../有权利...", word: "haveaccessto有机会.../有权利...", meaning: "" }
    ],
        split: "Inaworld//whereaverageisofficiallyover,//therearemanythings//(that)weneed todo//tosupportemployment,//butnothingwouldbemoreimportant//than passingsomekindofG.I.Bill//forthe21stcentury//thatensures//thatevery",
        grammar: ["主干1：主+系+表主干2：主+系+表", "where引导定语从句（修饰world）", "things后省略连接词that，引导定语从句（修饰things）", "but并列两个分句，两个分句均为“主+系+表”结构", "thanpassing...century是比较状语", "第1个that引导定语从句（修饰G.I.Bill）", "第2个that引导宾语从句"],
        ref: "在一个已正式告别平庸的世界里，我们需要做很多事情以扶持就业，但对21世纪来讲，最重要的事情莫过于出台《美国退伍军人权利法案》之类的法案，以确保每个美国人都有机会接受高中后教育。"
      }
    ]
  },
  {
    day: 149,
    type: "英二",
    source: "2013 Text 2",
    zh: "一个世纪前，横跨大西洋来到美国的移民中既有定居者，也有旅居客。许多人希望在美国建立永久家园，但也有人无意长留于此，打算赚些钱后便回返家乡。1908 到 1915 年间，约有700 万人抵达美国，而离开的大约有 200 万人。例如，约有四分之一的意大利移民最终永久返回了意大利。他们甚至有个亲切的昵称 uccelli di passaggio，“候鸟”。",
    sentences: [
    { num: "①", en: "A century ago, the immigrants from across the Atlantic included settlers and sojourners.", ref: "一个世纪前，横跨大西洋来到美国的移民中既有定居者，也有旅居客。",
      ai: { backbone: "主语 the immigrants、谓语 included、宾语 settlers and sojourners", structure: ["时间状语 A century ago：说明时间","介词短语 from across the Atlantic：作后置定语，修饰 immigrants"], collocations: ["from across the Atlantic（来自大西洋彼岸）","settlers and sojourners（定居者和旅居者）"] }},
    { num: "②", en: "Along with the many folks looking to make a permanent home in the United States came those who had no intention to stay, and those who would make some money and then go home.", ref: "许多人希望在美国建立永久家园，但也有人无意长留于此，打算赚些钱后便回返家乡。",
      ai: { backbone: "主句（倒装）：主语 those who had no intention to stay and those who would make some money and then go home、谓语 came", structure: ["介词短语 Along with the many folks looking to make a permanent home in the United States：作状语，置于句首引起倒装","现在分词短语 looking to make a permanent home：作后置定语，修饰 folks","并列主语 those who had no intention to stay：说明一类移民","定语从句 who had no intention to stay：修饰 those","并列主语 those who would make some money and then go home：说明另一类移民","定语从句 who would make some money and then go home：修饰 those"], collocations: ["along with（连同）","look to do（打算做某事）","make a permanent home（永久定居）","have no intention to do（无意做某事）","make some money（赚些钱）"] }},
    { num: "③", en: "Between 1908 and 1915, about 7 million people arrived while about 2 million departed.", ref: "1908 到 1915 年间，约有700 万人抵达美国，而离开的大约有 200 万人。",
      ai: { backbone: "主句：about 7 million people arrived；时间状语 Between 1908 and 1915", structure: ["时间状语从句 while about 2 million departed：表示“而……则……”","介词短语 Between 1908 and 1915：说明时间范围"], collocations: ["between...and...（在……与……之间）","arrive/depart（抵达/离开）"] }},
    { num: "④", en: "About a quarter of all Italian immigrants, for example, eventually returned to Italy for good.", ref: "例如，约有四分之一的意大利移民最终永久返回了意大利。",
      ai: { backbone: "主句：about a quarter of all Italian immigrants eventually returned、状语 to Italy for good", structure: ["介词短语 for example：作插入语","介词短语 for good：作状语，表示“永久地”"], collocations: ["a quarter of（四分之一）","return to...for good（永久返回……）"] }},
    { num: "⑤", en: "They even had an affectionate nickname, “uccelli di passaggio”, birds of passage.", ref: "他们甚至有个亲切的昵称 uccelli di passaggio，“候鸟”。",
      ai: { backbone: "主语 They、谓语 had、宾语 an affectionate nickname", structure: ["副词 even：作状语，加强语气","引语 “uccelli di passaggio”, birds of passage：作 nickname 的同位语，解释绰号含义","介词短语 birds of passage：说明该意大利语短语的含义"], collocations: ["an affectionate nickname（亲昵的绰号）","birds of passage（候鸟，指过客）"] }}
    ],
    analysis: [
      {
        sentNum: "②",
        vocab: [
      { raw: "folkn.人们", word: "folk", meaning: "n.人们" },
      { raw: "permanentadj.永久的，永恒的", word: "permanent", meaning: "adj.永久的，永恒的" },
      { raw: "intentionn.意图，目的，打算", word: "intention", meaning: "n.意图，目的，打算" },
      { raw: "alongwith连同...一起", word: "alongwith连同...一起", meaning: "" },
      { raw: "lookto期望，期待", word: "lookto期望，期待", meaning: "" }
    ],
        split: "Alongwiththemanyfolks//lookingtomakeapermanenthome//intheUnitedStates camethose//whohadnointentiontostay,//andthose//whowouldmakesome money//andthengohome.",
        grammar: ["主干：主+谓（倒装结构）", "结构提炼：alongwithAcameB=BcamealongwithA（强调B）", "本句为倒装结构，主干为“主+谓”结构，those作主语，came作谓语", "alongwiththemanyfolks作伴随状语，表示“与众多人一起”", "lookingtomakeapermanenthome是后置定语（修饰folks）", "intheUnitedStates是地点状语（修饰前面动作makeapermanenthome）", "who引导定语从句（修饰those）", "and并列两个those，描述两类人", "直译：与(希望在美国建立永久家园的)许多人一起来了那些(无意长留于此和打算", "赚些钱后便返回家乡的)人。(不通顺)"],
        ref: "许多人希望在美国建立永久家园，但也有人无意长留于此，打算赚些钱后便返回家乡。"
      }
    ]
  },
  {
    day: 150,
    type: "英二",
    source: "2013 Text 2",
    zh: "今天，我们对移民严格了许多。我们将新来者分为两类：合法或非法，好或坏。我们或将其誉为“缔造中的美国人”，或将其归于“需要驱逐的异族”。这一思维构架在很大程度上导致了我们的移民体系漏洞百出，也致使政府对“如何修复这一体系”处于长期瘫痪状态。我们无需更多类别，但需要改变对类别的思考方式。我们需要超越对“合法”和“非法”的严格定义。首先，我们可以认可那些“新候鸟”，那些于灰色地带生活并繁荣发展的人。之后，我们才有可能着手解决在移民方面面临的挑战。",
    sentences: [
    { num: "①", en: "Today, we are much more rigid about immigrants.", ref: "今天，我们对移民严格了许多。",
      ai: { backbone: "主语 we、谓语 are、表语 much more rigid；时间状语 Today", structure: ["介词短语 about immigrants：说明对待移民的态度","比较级 much more rigid：表示严格得多"], collocations: ["be rigid about（对……严格/僵化）"] }},
    { num: "②", en: "We divide newcomers into two categories: legal or illegal, good or bad.", ref: "我们将新来者分为两类：合法或非法，好或坏。",
      ai: { backbone: "主语 We、谓语 divide、宾语 newcomers、宾补 into two categories", structure: ["冒号后的 legal or illegal, good or bad：具体说明两类划分","介词短语 into two categories：与 divide 搭配"], collocations: ["divide...into（把……划分为）","two categories（两个类别）","legal or illegal（合法或非法）"] }},
    { num: "③", en: "We hail them as Americans in the making, or brand them as aliens to be kicked out.", ref: "我们或将其誉为“缔造中的美国人”，或将其归于“需要驱逐的异族”。",
      ai: { backbone: "并列句：句1 主语 We、谓语 hail、宾语 them、宾补 as Americans；句2 主语 We、谓语 brand、宾语 them、宾补 as aliens", structure: ["介词短语 as Americans in the making：说明视其为正在成为的美国人","介词短语 in the making：说明“在形成中”","并列连词 or：表示选择","介词短语 as aliens to be kicked out：说明被贴上的标签","不定式短语 to be kicked out：作后置定语，修饰 aliens"], collocations: ["hail...as（把……欢呼为）","Americans in the making（正在形成中的美国人）","brand...as（把……称为）","be kicked out（被驱逐）"] }},
    { num: "④", en: "That framework has contributed mightily to our broken immigration system and the long political paralysis over how to fix it.", ref: "这一思维构架在很大程度上导致了我们的移民体系漏洞百出，也致使政府对“如何修复这一体系”处于长期瘫痪状态。",
      ai: { backbone: "主语 That framework、谓语 has contributed、状语 mightily to our broken immigration system and the long political paralysis", structure: ["副词 mightily：作状语，表示“极大地”","介词短语 to our broken immigration system and the long political paralysis：与 contribute 搭配","介词短语 over how to fix it：作后置定语，修饰 paralysis"], collocations: ["contribute to（促成）","broken immigration system（失灵/破碎的移民体系）","political paralysis（政治僵局）"] }},
    { num: "⑤", en: "We don’t need more categories, but we need to change the way we think about categories.", ref: "我们无需更多类别，但需要改变对类别的思考方式。",
      ai: { backbone: "并列句：句1 主语 We、谓语 don’t need、宾语 more categories；句2 主语 we、谓语 need to change、宾语 the way", structure: ["转折连词 but：表转折","定语从句 we think about categories：修饰 the way（省略了关系代词）","介词短语 about categories：说明思考的对象"], collocations: ["need to do（需要做某事）","change the way we think（改变我们的思维方式）"] }},
    { num: "⑥", en: "We need to look beyond strict definitions of legal and illegal.", ref: "我们需要超越对“合法”和“非法”的严格定义。",
      ai: { backbone: "主语 We、谓语 need to look、状语 beyond strict definitions of legal and illegal", structure: ["介词短语 beyond strict definitions：说明超越的对象","介词短语 of legal and illegal：说明定义的内容"], collocations: ["look beyond（超越……看）","strict definitions（严格的定义）"] }},
    { num: "⑦", en: "To start, we can recognize the new birds of passage, those living and thriving in the gray areas.", ref: "首先，我们可以认可那些“新候鸟”，那些于灰色地带生活并繁荣发展的人。",
      ai: { backbone: "主句：主语 we、谓语 can recognize、宾语 the new birds of passage；目的状语 To start", structure: ["不定式短语 To start：作评注性状语，表示“首先”","现在分词短语 living and thriving in the gray areas：作后置定语，修饰 the new birds of passage"], collocations: ["to start（首先）","recognize（承认，认可）","the gray areas（灰色地带）","live and thrive（生活并蓬勃发展）"] }},
    { num: "⑧", en: "We might then begin to solve our immigration challenges.", ref: "之后，我们才有可能着手解决在移民方面面临的挑战。",
      ai: { backbone: "主句：主语 we、谓语 might then begin to solve、宾语 our immigration challenges", structure: ["副词 then：作状语，表示“然后/届时”"], collocations: ["begin to solve（开始解决）","immigration challenges（移民问题）"] }}
    ]
  }
];
