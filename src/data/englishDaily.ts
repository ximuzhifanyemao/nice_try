// 本文件由 doc/ 下 PDF 文件自动提取生成，请勿手改
// 包含：打卡原文 + 参考译文 + 长难句解析（单词、切分、语法、逐句译文）

export interface EnglishDaySentence {
  num: string
  en: string
  ref: string
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
    { num: "①", en: "Everybody loves a fat pay rise.", ref: "人人都爱丰厚加薪。" },
    { num: "②", en: "Yet pleasure at your own can vanish if you learn that a colleague has been given a bigger one.", ref: "然而假如你得知一位同事加薪比你更丰厚，那你的快乐可能会骤然消失。" },
    { num: "③", en: "Indeed, if he has a reputation for slacking, you might even be outraged.", ref: "事实上,如果他还有懒散的名声，那你甚至可能会变得震怒。" },
    { num: "④", en: "Such behaviour is regarded as “all too human”, with the underlying assumption that other animals would not be capable of this finely developed sense of grievance.", ref: "这样的行为被认为是“人之常情”，其潜在假设是其他动物不具有这种高度发达的委屈意识。" },
    { num: "⑤", en: "But a study by Sarah Brosnan and Frans de Waal of Emory University in Atlanta, Georgia, which has just been published in Nature, suggests that it is all too monkey, as well.", ref: "但由佐治亚州亚特兰大市埃默里大学的萨拉·布鲁斯南和弗兰斯·德·瓦尔完成的一项刚刚发表于《自然》上的研究表明，这也是“猴之常情”。" }
    ]
  },
  {
    day: 2,
    type: "英一",
    source: "2005 Text 1",
    zh: "研究者们研究了雌性棕色卷尾猴的习性。这些猴子看起来很可爱。它们是生性温和，乐于合作的动物，且愿意分享食物。最重要的是,像人类女性一样,它们往往比雄性更注重“物品与服务”的价值。",
    sentences: [
    { num: "①", en: "The researchers studied the behaviour of female brown capuchin monkeys.", ref: "研究者们研究了雌性棕色卷尾猴的习性。" },
    { num: "②", en: "They look cute.", ref: "这些猴子看起来很可爱。" },
    { num: "③", en: "They are good-natured, co-operative creatures, and they share their food readily.", ref: "它们是生性温和，乐于合作的动物，且愿意分享食物。" },
    { num: "④", en: "Above all, like their female human counterparts, they tend to pay much closer attention to the value of “goods and services” than males.", ref: "最重要的是,像人类女性一样,它们往往比雄性更注重“物品与服务”的价值。" }
    ]
  },
  {
    day: 3,
    type: "英一",
    source: "2005 Text 1",
    zh: "这些特征使它们成为布鲁斯南博士和德·瓦尔博士研究的理想对象。研究人员花费了两年的时间教猴子用代币换取食物。通常情况下，猴子很乐意用石块换取黄瓜片。然而，当两只猴子被安置在隔开但相邻的房间里，以便它们能够看到彼此用石块换取的东西时，它们的行为就会变得明显不同了。",
    sentences: [
    { num: "①", en: "Such characteristics make them perfect candidates for Dr. Brosnan’s and Dr. de Waal’s study.", ref: "这些特征使它们成为布鲁斯南博士和德·瓦尔博士研究的理想对象。" },
    { num: "②", en: "The researchers spent two years teaching their monkeys to exchange tokens for food.", ref: "研究人员花费了两年的时间教猴子用代币换取食物。" },
    { num: "③", en: "Normally, the monkeys were happy enough to exchange pieces of rock for slices of cucumber.", ref: "通常情况下，猴子很乐意用石块换取黄瓜片。" },
    { num: "④", en: "However, when two monkeys were placed in separate but adjoining chambers, so that each could observe what the other was getting in return for its rock, their behaviour became markedly different.", ref: "然而，当两只猴子被安置在隔开但相邻的房间里，以便它们能够看到彼此用石块换取的东西时，它们的行为就会变得明显不同了。" }
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
    { num: "①", en: "In the world of capuchins grapes are luxury goods (and much preferable to cucumbers).", ref: "在卷尾猴的世界里，葡萄是奢侈品（且比黄瓜要受欢迎得多）。" },
    { num: "②", en: "So when one monkey was handed a grape in exchange for her token, the second was reluctant to hand hers over for a mere piece of cucumber.", ref: "所以当一只猴子用一个代币换到一颗葡萄时，第二只猴子就不愿意用自己的代币只换取一片黄瓜了。" },
    { num: "③", en: "And if one received a grape without having to provide her token in exchange at all, the other either tossed her own token at the researcher or out of the chamber, or refused to accept the slice of cucumber.", ref: "如果一只猴子根本无需用代币作为交换就得到一颗葡萄，那么另一只猴子就会把代币砸向研究人员或者扔出房间外，或者拒绝接受那片黄瓜。" },
    { num: "④", en: "Indeed, the mere presence of a grape in the other chamber (without an actual monkey to eat it) was enough to induce resentment in a female capuchin.", ref: "事实上，只要在另一个房间出现了葡萄（根本没有猴子吃它），就足以引起雌性卷尾猴的愤恨了。" }
    ]
  },
  {
    day: 5,
    type: "英一",
    source: "2005 Text 1",
    zh: "研究人员指出，正如人类一样，卷尾猴也受到社会情感的支配。在野外，它们是协作、群居的物种。只有当每只猴子都感到自己没有遭受不公时，这种协作才可能稳定。义愤感似乎不只是人类的专利。拒绝一份较少的酬劳可以完全将这些情绪十分明确地传达给组内其他成员。但是这种公平感是从卷尾猴和人类身上各自演化而来，还是来源于三千五百万年以前他们共同的祖先，至今仍是个有待回答的问题。",
    sentences: [
    { num: "①", en: "The researchers suggest that capuchin monkeys, like humans, are guided by social emotions.", ref: "研究人员指出，正如人类一样，卷尾猴也受到社会情感的支配。" },
    { num: "②", en: "In the wild, they are a co-operative, group-living species.", ref: "在野外，它们是协作、群居的物种。" },
    { num: "③", en: "Such co-operation is likely to be stable only when each animal feels it is not being cheated.", ref: "只有当每只猴子都感到自己没有遭受不公时，这种协作才可能稳定。" },
    { num: "④", en: "Feelings of righteous indignation, it seems, are not the preserve of people alone.", ref: "义愤感似乎不只是人类的专利。" },
    { num: "⑤", en: "Refusing a lesser reward completely makes these feelings abundantly clear to other members of the group.", ref: "拒绝一份较少的酬劳可以完全将这些情绪十分明确地传达给组内其他成员。" },
    { num: "⑥", en: "However, whether such a sense of fairness evolved independently in capuchins and humans, or whether it stems from the common ancestor that the species had 35 million years ago, is, as yet, an unanswered question.", ref: "但是这种公平感是从卷尾猴和人类身上各自演化而来，还是来源于三千五百万年以前他们共同的祖先，至今仍是个有待回答的问题。" }
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
    zh: "还记得那些年吗？科学家们提出吸烟会使我们丧命，而怀疑者们却坚称我们对此无法定论；他们坚称证据不确凿，科学不确定；他们坚称反对吸烟的游说者企图破坏我们的生活方式，而政府应该置身事外。许多美国人听信了那些谬论，结果过去三十年间，大约一千万烟民过早地进了坟墓。",
    sentences: [
    { num: "①", en: "Do you remember all those years when scientists argued that smoking would kill us but the doubters insisted that we didn’t know for sure?", ref: "还记得那些年吗？" },
    { num: "②", en: "That the evidence was inconclusive, the science uncertain? That the antismoking lobby was out to destroy our way of life and the government should stay out of the way?", ref: "科学家们提出吸烟会使我们丧命，而怀疑者们却坚称我们对此无法定论；他们坚称证据不确凿，科学不确定；他们坚称反对吸烟的游说者企图破坏我们的生活方式，而政府应该置身事外。" },
    { num: "③", en: "Lots of Americans bought that nonsense, and over three decades, some 10 million smokers went to early graves.", ref: "许多美国人听信了那些谬论，结果过去三十年间，大约一千万烟民过早地进了坟墓。" }
    ]
  },
  {
    day: 7,
    type: "英一",
    source: "2005 Text 2",
    zh: "如今，在科学家们前赴后继努力唤醒我们关注全球变暖这一与日俱增的威胁之时令人不安的类似情形再次出现。最新一轮（的科学家努力）是，受白宫邀请成立的国家科学院专家小组告诉我们，地球气候毫无疑问正在变暖，而且这一问题主要是人为造成的。（他们传达的）明确信息是我们应该立刻着手保护自己。国家科学院院长布鲁斯·阿尔伯特在专家小组报告的前言中加上了这一重要观点：“科学从来都不能解答所有问题。但科学确实为我们提供了关于未来的最好的可行性指导，我们国家和整个世界在做重要决策时，应该以科学能够提供的关于人类当前行为对未来影响的最佳判断为依据，这一点至关重要。”",
    sentences: [
    { num: "①", en: "There are upsetting parallels today, as scientists in one wave after another try to awaken us to the growing threat of global warming.", ref: "如今，在科学家们前赴后继努力唤醒我们关注全球变暖这一与日俱增的威胁之时令人不安的类似情形再次出现。" },
    { num: "②", en: "The latest was a panel from the National Academy of Sciences, enlisted by the White House, to tell us that the Earth’s atmosphere is definitely warming and that the problem is largely man-made.", ref: "最新一轮（的科学家努力）是，受白宫邀请成立的国家科学院专家小组告诉我们，地球气候毫无疑问正在变暖，而且这一问题主要是人为造成的。" },
    { num: "③", en: "The clear message is that we should get moving to protect ourselves.", ref: "（他们传达的）明确信息是我们应该立刻着手保护自己。" },
    { num: "④", en: "The president of the National Academy, Bruce Alberts, added this key point in the preface to the panel’s report: “Science never has all the answers.", ref: "国家科学院院长布鲁斯·阿尔伯特在专家小组报告的前言中加上了这一重要观点：“科学从来都不能解答所有问题。" },
    { num: "⑤", en: "But science does provide us with the best available guide to the future, and it is critical that our nation and the world base important policies on the best judgments that science can provide concerning the future consequences of present actions.”", ref: "但科学确实为我们提供了关于未来的最好的可行性指导，我们国家和整个世界在做重要决策时，应该以科学能够提供的关于人类当前行为对未来影响的最佳判断为依据，这一点至关重要。”" }
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
    { num: "①", en: "Just as on smoking, voices now come from many quarters insisting that the science about global warming is incomplete, that it’s OK to keep pouring fumes into the air until we know for sure.", ref: "就像在吸烟问题上一样，现在来自多方面的声音坚持认为有关全球变暖的科学研究还不完善，在我们证实这件事之前可以继续向大气中排放废气。" },
    { num: "②", en: "This is a dangerous game: by the time 100 percent of the evidence is in, it may be too late.", ref: "这是一个危险的游戏：到证据百分之百确凿的时候，可能就太晚了。" },
    { num: "③", en: "With the risks obvious and growing, a prudent people would take out an insurance policy now.", ref: "随着风险日益明显并加剧，明智谨慎的民族现在就应该采取防范措施了。" }
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
    { num: "①", en: "Fortunately, the White House is starting to pay attention.", ref: "幸运的是，白宫开始关注此事。" },
    { num: "②", en: "But it’s obvious that a majority of the president’s advisers still don’t take global warming seriously.", ref: "但很显然，大多数总统顾问仍旧没有严肃看待全球变暖这个问题。" },
    { num: "③", en: "Instead of a plan of action, they continue to press for more research—a classic case of “paralysis by analysis”.", ref: "他们没有出台行动计划，相反，只是继续敦促进行更多研究——典型的分析导致“瘫痪”的案例。" }
    ]
  },
  {
    day: 10,
    type: "英一",
    source: "2005 Text 2",
    zh: "为了担负好地球保护者的责任，我们必须加紧推进对于大气和海洋的深入研究。但仅有研究还不够。如果政府不行使立法动议权，国会应当开始帮助制定保护措施。西弗吉尼亚的民主党参议员罗伯特 · 伯德提出的一项议案——为私企提供财政奖励——就是一个很有希望的开端。许多人看到我们国家正准备修建许多新发电厂，以满足我们的能源需求。如果我们想要保护大气，那么关键是要让这些新发电厂对环境无害。",
    sentences: [
    { num: "①", en: "To serve as responsible stewards of the planet, we must press forward on deeper atmospheric and oceanic research.", ref: "为了担负好地球保护者的责任，我们必须加紧推进对于大气和海洋的深入研究。" },
    { num: "②", en: "But research alone is inadequate.", ref: "但仅有研究还不够。" },
    { num: "③", en: "If the Administration won’t take the legislative initiative, Congress should help to begin fashioning conservation measures.", ref: "如果政府不行使立法动议权，国会应当开始帮助制定保护措施。" },
    { num: "④", en: "A bill by Democratic Senator Robert Byrd of West Virginia, which would offer financial incentives for private industry, is a promising start.", ref: "西弗吉尼亚的民主党参议员罗伯特 · 伯德提出的一项议案——为私企提供财政奖励——就是一个很有希望的开端。" },
    { num: "⑤", en: "Many see that the country is getting ready to build lots of new power plants to meet our energy needs.", ref: "许多人看到我们国家正准备修建许多新发电厂，以满足我们的能源需求。" },
    { num: "⑥", en: "If we are ever going to protect the atmosphere, it is crucial that those new plants be environmentally sound.", ref: "如果我们想要保护大气，那么关键是要让这些新发电厂对环境无害。" }
    ]
  },
  {
    day: 11,
    type: "英一",
    source: "2005 Text 3",
    zh: "在一夜好眠的所有因素中，梦似乎是最无法控制的。在梦中，有一扇窗通向逻辑暂时失效、死人开口说话的世界。一个世纪前弗洛伊德创立了他的革命性理论——梦是人们无意识的欲望和恐惧所伪装的影子；到了 20 世纪 70 年代末，神经学家们转而认为梦仅仅是“精神噪音”——睡眠期间持续进行的神经修复活动的随机副产品。现在，研究者觉察到梦是大脑情绪自动调节系统的组成部分，当大脑处于“离线”状态时对情绪进行调整。一位有影响力的权威人士认为，这种异常重要的精神活动不仅能被利用，事实上还可以将其置于有意识的控制之下，以使得我们的睡眠质量更高、心情更好。芝加哥医疗中心心理部主任罗莎琳德·卡特赖特说：“这是你的梦。若不喜欢它，就改变它”",
    sentences: [
    { num: "①", en: "Of all the components of a good night’s sleep, dreams seem to be least within our control.", ref: "在一夜好眠的所有因素中，梦似乎是最无法控制的。" },
    { num: "②", en: "In dreams, a window opens into a world where logic is suspended and dead people speak.", ref: "在梦中，有一扇窗通向逻辑暂时失效、死人开口说话的世界。" },
    { num: "③", en: "A century ago, Freud formulated his revolutionary theory that dreams were the disguised shadows of our unconscious desires and fears; by the late 1970s, neurologists had switched to thinking of them as just “mental noise”—the random byproducts of the neural-repair work that goes on during sleep.", ref: "一个世纪前弗洛伊德创立了他的革命性理论——梦是人们无意识的欲望和恐惧所伪装的影子；到了 20 世纪 70 年代末，神经学家们转而认为梦仅仅是“精神噪音”——睡眠期间持续进行的神经修复活动的随机副产品。" },
    { num: "④", en: "Now researchers suspect that dreams are part of the mind’s emotional thermostat, regulating moods while the brain is “off-line.”", ref: "现在，研究者觉察到梦是大脑情绪自动调节系统的组成部分，当大脑处于“离线”状态时对情绪进行调整。" },
    { num: "⑤", en: "And one leading authority says that these intensely powerful mental events can be not only harnessed but actually brought under conscious control, to help us sleep and feel better.", ref: "一位有影响力的权威人士认为，这种异常重要的精神活动不仅能被利用，事实上还可以将其置于有意识的控制之下，以使得我们的睡眠质量更高、心情更好。" },
    { num: "⑥", en: "“It’s your dream,” says Rosalind Cartwright, chair of psychology at Chicago’s Medical Center.", ref: "芝加哥医疗中心心理部主任罗莎琳德·卡特赖特说：“这是你的梦。" },
    { num: "⑦", en: "“If you don’t like it, change it.”", ref: "若不喜欢它，就改变它”" }
    ]
  },
  {
    day: 12,
    type: "英一",
    source: "2005 Text 3",
    zh: "来自大脑成像的证据证实了这个观点。匹兹堡大学的埃里克博士说，大脑在快速动眼睡眠中——大多数清晰梦境出现的时刻——和完全清醒时一样活跃。但并非大脑的所有部分都同等活跃，脑边缘系统（“情绪脑”）异常活跃，而前额皮层（思维和推理的中心地带）则相对平静。斯坦福睡眠研究员威廉 · 迪蒙特博士说：“我们从梦中醒来，无论是高兴还是沮丧这些情绪都会伴随我们一整天。”",
    sentences: [
    { num: "①", en: "Evidence from brain imaging supports this view.", ref: "来自大脑成像的证据证实了这个观点。" },
    { num: "②", en: "The brain is as active during REM (rapid eye movement) sleep—when most vivid dreams occur—as it is when fully awake, says Dr. Eric Nofzinger at the University of Pittsburgh.", ref: "匹兹堡大学的埃里克博士说，大脑在快速动眼睡眠中——大多数清晰梦境出现的时刻——和完全清醒时一样活跃。" },
    { num: "③", en: "But not all parts of the brain are equally involved; the limbic system (the “emotional brain”) is especially active, while the prefrontal cortex (the center of intellect and reasoning) is relatively quiet.", ref: "但并非大脑的所有部分都同等活跃，脑边缘系统（“情绪脑”）异常活跃，而前额皮层（思维和推理的中心地带）则相对平静。" },
    { num: "④", en: "“We wake up from dreams happy or depressed, and those feelings can stay with us all day.” says Stanford sleep researcher Dr. William Dement.", ref: "斯坦福睡眠研究员威廉 · 迪蒙特博士说：“我们从梦中醒来，无论是高兴还是沮丧这些情绪都会伴随我们一整天。”" }
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
    { num: "①", en: "The link between dreams and emotions shows up among the patients in Cartwright’s clinic.", ref: "梦和情绪的关联在卡特赖特诊所的病人身上显露出来。" },
    { num: "②", en: "Most people seem to have more bad dreams early in the night, progressing toward happier ones before awakening, suggesting that they are working through negative feelings generated during the day.", ref: "大多数人似乎在晚上入睡早期做更多不好的梦，而在醒来前会逐渐做开心一些的梦，这说明人们在梦里逐渐化解白天所产生的负面情绪。" },
    { num: "③", en: "Because our conscious mind is occupied with daily life we don’t always think about the emotional significance of the day’s events—until, it appears, we begin to dream.", ref: "因为我们有意识的大脑被日常事务占据，所以并不总能思考白天所发生的重大事件的情感意义——似乎直到开始做梦时才会。" }
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
    { num: "①", en: "And this process need not be left to the unconscious.", ref: "这一过程未必是无意识的。" },
    { num: "②", en: "Cartwright believes one can exercise conscious control over recurring bad dreams.", ref: "卡特赖特认为人们可以对不断重现的噩梦施加有意识的控制。" },
    { num: "③", en: "As soon as you awaken, identify what is upsetting about the dream.", ref: "一醒来，立刻确定梦中是什么在困扰你。" },
    { num: "④", en: "Visualize how you would like it to end instead; the next time it occurs, try to wake up just enough to control its course.", ref: "想象一下你想要它如何结束；下次再做同样的梦时，尽量及时醒来以控制它的进程。" },
    { num: "⑤", en: "With much practice people can learn to, literally, do it in their sleep.", ref: "多加练习，人们真的可以学会在梦中这样做。" }
    ]
  },
  {
    day: 15,
    type: "英一",
    source: "2005 Text 3",
    zh: "总的来说，我们几乎没有理由在意所做的梦，除非它们使我们无法安睡或“从惊恐中醒来”卡特赖特认为。恐怖主义、经济不确定及常见的不安全感都增加了人们的焦虑。那些长期遭受梦魇折磨的人应该寻求治疗专家帮助。对其他人来说，大脑有其化解不良情绪的方法。枕着忧虑睡觉甚至入梦，早上醒来时你会感觉好多了。",
    sentences: [
    { num: "①", en: "At the end of the day, there’s probably little reason to pay attention to our dreams at all unless they keep us from sleeping or “we wake up in a panic,” Cartwright says.", ref: "总的来说，我们几乎没有理由在意所做的梦，除非它们使我们无法安睡或“从惊恐中醒来”卡特赖特认为。" },
    { num: "②", en: "Terrorism, economic uncertainties and general feelings of insecurity have increased people’s anxiety.", ref: "恐怖主义、经济不确定及常见的不安全感都增加了人们的焦虑。" },
    { num: "③", en: "Those suffering from persistent nightmares should seek help from a therapist.", ref: "那些长期遭受梦魇折磨的人应该寻求治疗专家帮助。" },
    { num: "④", en: "For the rest of us, the brain has its ways of working through bad feelings.", ref: "对其他人来说，大脑有其化解不良情绪的方法。" },
    { num: "⑤", en: "Sleep—or rather dream—on it and you’ll feel better in the morning.", ref: "枕着忧虑睡觉甚至入梦，早上醒来时你会感觉好多了。" }
    ]
  },
  {
    day: 16,
    type: "英一",
    source: "2005 Text 4",
    zh: "无论在演讲还是在写作上，美国人都不再期望公众人物在英语语言的使用上展现出技能与天赋：而公众人物自身也不渴求有这种语言驾驭能力。约翰·麦荷特——不仅是语言学家，而且是一位混杂着自由派与保守派观点的善辩者——在其新书《做我们自己的事：语言和音乐的退化，以及为什么我们应该，呃，在意》中认为，20 世纪 60 年代反文化运动的胜利是导致正式英语衰落的主要原因。",
    sentences: [
    { num: "①", en: "Americans no longer expect public figures, whether in speech or in writing, to command the English language with skill and gift. Nor do they aspire to such command themselves.", ref: "无论在演讲还是在写作上，美国人都不再期望公众人物在英语语言的使用上展现出技能与天赋：而公众人物自身也不渴求有这种语言驾驭能力。" },
    { num: "②", en: "In his latest book, Doing Our Own Thing: The Degradation of language and Music and Why We Should Like, Care, John McWhorter, a linguist and controversialist of mixed liberal and conservative views, sees the triumph of 1960s counter-culture as responsible for the decline of formal English.", ref: "约翰·麦荷特——不仅是语言学家，而且是一位混杂着自由派与保守派观点的善辩者——在其新书《做我们自己的事：语言和音乐的退化，以及为什么我们应该，呃，在意》中认为，20 世纪 60 年代反文化运动的胜利是导致正式英语衰落的主要原因。" }
    ]
  },
  {
    day: 17,
    type: "英一",
    source: "2005 Text 4",
    zh: "责怪纵容放任的 20 世纪 60 年代并不新鲜，但这次却不是对教育退步的又一场批判。麦荷特先生的学术专长是语言的历史与变迁。举例来说，他认为“whom”一词的逐渐消失是自然的，和古英语中词格尾缀的消失一样根本没什么可遗憾的。",
    sentences: [
    { num: "①", en: "Blaming the permissive 1960s is nothing new, but this is not yet another criticism against the decline in education.", ref: "责怪纵容放任的 20 世纪 60 年代并不新鲜，但这次却不是对教育退步的又一场批判。" },
    { num: "②", en: "Mr. McWhorter’s academic speciality is language history and change, and he sees the gradual disappearance of “whom”, for example, to be natural and no more regrettable than the loss of the case-endings of Old English.", ref: "麦荷特先生的学术专长是语言的历史与变迁。举例来说，他认为“whom”一词的逐渐消失是自然的，和古英语中词格尾缀的消失一样根本没什么可遗憾的。" }
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
    { num: "①", en: "But the cult of the authentic and the personal, “doing our own thing”, has spelt the death of formal speech, writing, poetry and music.", ref: "然而，对真实和个性的狂热推崇，即“做我们自己的事”，已经招致了正式的演讲、写作、诗歌及音乐的消亡。" },
    { num: "②", en: "While even the modestly educated sought an elevated tone when they put pen to paper before the 1960s, even the most well regarded writing since then has sought to capture spoken English on the page.", ref: "在 20 世纪 60 年代以前，就算是受教育不太多的人在下笔时都会寻求一种高格调；而在那之后,即使是最受好评的文章也力求在书面上体现口语化。" },
    { num: "③", en: "Equally, in poetry, the highly personal, performative genre is the only form that could claim real liveliness.", ref: "同样，在诗歌方面，极具个性化与表现力的风格是唯一能够体现真实生动的形式。" },
    { num: "④", en: "In both oral and written English, talking is triumphing over speaking, spontaneity over craft.", ref: "无论是在口语还是书面语中，随意言谈胜过了正式讲话，即兴发挥也胜过了精雕细琢。" }
    ]
  },
  {
    day: 19,
    type: "英一",
    source: "2005 Text 4",
    zh: "麦荷特先生从雅俗文化中列举了大量有趣的例子，从而说明他所记录的趋势是确凿无疑的。但就书中副标题提出的问题“为什么我们应该，呃，在意”，答案却不够明确。作为语言学家，麦荷特承认人类各种各样的语言，包括像黑人英语这样的非标准语言，都具有强大的表达力——世上没有传达不了复杂思想的语言或方言。与其他大多数人不同，麦荷特先生并没有坚持认为“我们说话方式不规范就会让我们无法准确地思考”。",
    sentences: [
    { num: "①", en: "Illustrated with an entertaining array of examples from both high and low culture, the trend that Mr. McWhorter documents is unmistakable.", ref: "麦荷特先生从雅俗文化中列举了大量有趣的例子，从而说明他所记录的趋势是确凿无疑的。" },
    { num: "②", en: "But it is less clear, to take the question of his subtitle, why we should, like, care.", ref: "但就书中副标题提出的问题“为什么我们应该，呃，在意”，答案却不够明确。" },
    { num: "③", en: "As a linguist, he acknowledges that all varieties of human language, including non-standard ones like Black English, can be powerfully expressive—there exists no language or dialect in the world that cannot convey complex ideas.", ref: "作为语言学家，麦荷特承认人类各种各样的语言，包括像黑人英语这样的非标准语言，都具有强大的表达力——世上没有传达不了复杂思想的语言或方言。" },
    { num: "④", en: "He is not arguing, as many do, that we can no longer think straight because we do not talk proper.", ref: "与其他大多数人不同，麦荷特先生并没有坚持认为“我们说话方式不规范就会让我们无法准确地思考”。" }
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
    { num: "①", en: "Russians have a deep love for their own language and carry large chunks of memorized poetry in their heads, while Italian politicians tend to elaborate speech that would seem old-fashioned to most English-speakers.", ref: "俄罗斯人深爱自己的语言，他们的脑海中深印着大段大段的诗歌；而意大利的政客们则往往精心准备演讲，尽管这在大多数讲英语的人们看来已经过时了。" },
    { num: "②", en: "Mr. McWhorter acknowledges that formal language is not strictly necessary, and proposes no radical education reforms—he is really grieving over the loss of something beautiful more than useful.", ref: "麦荷特先生承认正式语言并非绝对的不可或缺，他也没有提议要进行彻底的教育改革——他其实只是为那些美好多过实用的事物的消逝而哀叹。" },
    { num: "③", en: "We now take our English “on paper plates instead of china”.", ref: "我们现在用“纸盘”而非“瓷盘”盛着我们的英语大餐。" },
    { num: "④", en: "A shame, perhaps, but probably an inevitable one.", ref: "这或许令人遗憾,但也许又是不可避免的。" }
    ]
  },
  {
    day: 21,
    type: "英一",
    source: "2006 Text 1",
    zh: "尽管“无休止地谈论差异”，美国社会却是一部使人们同化的惊人机器。大众文化有着“服饰和言语上大众化的一致，以及随意和不拘礼节”的特征。人们被一种由 19 世纪的百货商场掀起的“消费文化”所同化，这些商店“在体面的环境中供应琳琅满目的商品”。这些不是迎合知识精英的私密商店，而是“不论阶级或背景，任何人都可以进入的百货商店。这使得购物转变为一种公共和大众的行为”。大众传媒、广告和体育赛事是同化的其他推动力。",
    sentences: [
    { num: "①", en: "In spite of “endless talk of difference,” American society is an amazing machine for homogenizing people.", ref: "尽管“无休止地谈论差异”，美国社会却是一部使人们同化的惊人机器。" },
    { num: "②", en: "There is “the democratizing uniformity of dress and discourse, and the casualness and absence of deference” characteristic of popular culture.", ref: "大众文化有着“服饰和言语上大众化的一致，以及随意和不拘礼节”的特征。" },
    { num: "③", en: "People are absorbed into “a culture of consumption” launched by the 19th-century department stores that offered “vast arrays of goods in an elegant atmosphere.", ref: "人们被一种由 19 世纪的百货商场掀起的“消费文化”所同化，这些商店“在体面的环境中供应琳琅满目的商品”。" },
    { num: "④", en: "Instead of intimate shops catering to a knowledgeable elite” these were stores “anyone could enter, regardless of class or background.", ref: "这些不是迎合知识精英的私密商店，而是“不论阶级或背景，任何人都可以进入的百货商店。" },
    { num: "⑤", en: "This turned shopping into a public and democratic act.”", ref: "这使得购物转变为一种公共和大众的行为”。" },
    { num: "⑥", en: "The mass media, advertising and sports are other forces for homogenization.", ref: "大众传媒、广告和体育赛事是同化的其他推动力。" }
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
    { num: "①", en: "Immigrants are quickly fitting into this common culture, which may not be altogether elevating but is hardly poisonous.", ref: "移民正在快速融入这种共同文化，这也许不太具有提升作用，但也几乎不可能有什么害处。" },
    { num: "②", en: "Writing for the National Immigration Forum, Gregory Rodriguez reports that today’s immigration is neither at unprecedented levels nor resistant to assimilation.", ref: "在为“国家移民论坛”撰稿时，格雷戈里·罗德里格兹写道，如今的移民既未达到前所未有的水平也没有拒斥同化。" },
    { num: "③", en: "In 1998 immigrants were 9.8 percent of the population; in 1900, 13.6 percent.", ref: "1998 年移民占人口总数的 9.8%，1900 年占 13.6%。" },
    { num: "④", en: "In the 10 years prior to 1990, 3.1 immigrants arrived for every 1,000 residents; in the 10 years prior to 1890, 9.2 for every 1,000.", ref: "在 1990 年之前的 10 年中，每有 1000 个居民，便有 3.1 个移民初次来到（美国）；在 1890 年之前的 10年中，二者比值为 9.2 :1000。" },
    { num: "⑤", en: "Now, consider three indices of assimilation—language, home ownership and intermarriage.", ref: "现在，考虑一下同化的三个指标——语言、住房自有和异族通婚。" }
    ]
  },
  {
    day: 23,
    type: "英一",
    source: "2006 Text 1",
    zh: "1990 年人口普查结果显示，“来自于 15 个最常见原籍国的大多数移民在居住十年后英语都讲得‘不错’或‘非常好’”。移民的子女往往通晓双语并精通英语。“到了第三代，族裔语言在大部分移民家庭中已经消失。”因此美国被形容为语言的“墓地”。到 1996 年止，1970年前到达的、外国出生的移民住房自有率达 75.6%，高于本国出生的美国人 69.8%的比例。",
    sentences: [
    { num: "①", en: "The 1990 Census revealed that “a majority of immigrants from each of the fifteen most common countries of origin spoke English ‘well’ or ‘very well’ after ten years of residence.”", ref: "1990 年人口普查结果显示，“来自于 15 个最常见原籍国的大多数移民在居住十年后英语都讲得‘不错’或‘非常好’”。" },
    { num: "②", en: "The children of immigrants tend to be bilingual and proficient in English.", ref: "移民的子女往往通晓双语并精通英语。" },
    { num: "③", en: "“By the third generation, the original language is lost in the majority of immigrant families.”", ref: "“到了第三代，族裔语言在大部分移民家庭中已经消失。" },
    { num: "④", en: "Hence the description of America as a “graveyard” for languages.", ref: "因此美国被形容为语言的“墓地”。" },
    { num: "⑤", en: "By 1996 foreign-born immigrants who had arrived before 1970 had a home ownership rate of 75.6 percent, higher than the 69.8 percent rate among native-born Americans.", ref: "到 1996 年止，1970年前到达的、外国出生的移民住房自有率达 75.6%，高于本国出生的美国人 69.8%的比例。" }
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
    { num: "①", en: "Foreign-born Asians and Hispanics “have higher rates of intermarriage than do U.S.-born whites and blacks.”", ref: "外国出生的亚裔和西班牙裔移民的异族通婚率比美国本土出生的黑人和白人的异族通婚率要高”。" },
    { num: "②", en: "By the third generation, one third of Hispanic women are married to non-Hispanics, and 41 percent of Asian-American women are married to non-Asians.", ref: "到了第三代，三分之一的西班牙裔女性嫁给了非西班牙裔，41%的亚裔美国女性嫁给了非亚裔。" }
    ]
  },
  {
    day: 25,
    type: "英一",
    source: "2006 Text 1",
    zh: "罗德里格兹指出，世界各地偏远乡村的儿童都是像阿诺德·施瓦辛格和加斯·布鲁克斯这样的超级明星的粉丝，然而“有些美国人担心，居住在美国境内的移民依然以某种方式不受这个国家同化力量的影响”在美国存在引起分歧的问题和小范围涌动的怒火吗？确实存在。美国太大，什么情形都会有一点。但是，尤其在美国动荡过去的背景下来看，今天的社会指标几乎并未显示出一种黯淡退化的社会环境。",
    sentences: [
    { num: "①", en: "Rodriguez notes that children in remote villages around the world are fans of superstars like Arnold Schwarzenegger and Garth Brooks, yet “some Americans fear that immigrants living within the United States remain somehow immune to the nation’s assimilative power.” Are there divisive issues and pockets of seething anger in America?", ref: "罗德里格兹指出，世界各地偏远乡村的儿童都是像阿诺德·施瓦辛格和加斯·布鲁克斯这样的超级明星的粉丝，然而“有些美国人担心，居住在美国境内的移民依然以某种方式不受这个国家同化力量的影响”在美国存在引起分歧的问题和小范围涌动的怒火吗？" },
    { num: "②", en: "Indeed.", ref: "确实存在。" },
    { num: "③", en: "It is big enough to have a bit of everything.", ref: "美国太大，什么情形都会有一点。" },
    { num: "④", en: "But particularly when viewed against America’s turbulent past, today’s social indices hardly suggest a dark and deteriorating social environment.", ref: "但是，尤其在美国动荡过去的背景下来看，今天的社会指标几乎并未显示出一种黯淡退化的社会环境。" }
    ]
  },
  {
    day: 26,
    type: "英一",
    source: "2006 Text 2",
    zh: "众所周知，埃文河畔的斯特拉特福德镇只有一个产业——威廉·莎士比亚，却有两个泾渭分明且日益敌对的派别。一方是皇家莎士比亚剧团（RSC），它在埃文河畔的莎士比亚纪念剧院上演精彩绝伦的剧目。另一方是当地居民，他们在很大程度上依赖那些来此不是为了看戏，而是为了看安妮·海瑟薇（注：莎士比亚的妻子）小屋、莎士比亚出生地以及其他景点的观光客而生活。斯特拉福德镇“令人尊敬”的居民们认为剧院没有为他们增添哪怕一分钱的收入。他们毫不掩饰地讨厌皇家莎士比亚剧团的演员：这些演员们留着长发、蓄着胡须、穿着凉鞋，吵吵嚷嚷。当你想到养活他们的莎士比亚本人就是个（留着胡须的）演员而且噪音制造也有他一份时，这真是绝妙的讽刺。",
    sentences: [
    { num: "①", en: "Stratford-on-Avon, as we all know, has only one industry --William Shakespeare -- but there are two distinctly separate and increasingly hostile branches.", ref: "众所周知，埃文河畔的斯特拉特福德镇只有一个产业——威廉·莎士比亚，却有两个泾渭分明且日益敌对的派别。" },
    { num: "②", en: "There is the Royal Shakespeare Company (RSC), which presents superb productions of the plays at the Shakespeare Memorial Theatre on the Avon.", ref: "一方是皇家莎士比亚剧团（RSC），它在埃文河畔的莎士比亚纪念剧院上演精彩绝伦的剧目。" },
    { num: "③", en: "And there are the townsfolk who largely live off the tourists who come, not to see the plays, but to look at Anne Hathaway's Cottage, Shakespeare's birthplace and the other sights.", ref: "另一方是当地居民，他们在很大程度上依赖那些来此不是为了看戏，而是为了看安妮·海瑟薇（注：莎士比亚的妻子）小屋、莎士比亚出生地以及其他景点的观光客而生活。" },
    { num: "④", en: "The worthy residents of Stratford doubt that the theater adds a penny to their revenue.", ref: "斯特拉福德镇“令人尊敬”的居民们认为剧院没有为他们增添哪怕一分钱的收入。" },
    { num: "⑤", en: "They frankly dislike the RSC's actors, them with their long hair and beards and sandals and noisiness.", ref: "他们毫不掩饰地讨厌皇家莎士比亚剧团的演员：这些演员们留着长发、蓄着胡须、穿着凉鞋，吵吵嚷嚷。" },
    { num: "⑥", en: "It's all deliciously ironic when you consider that Shakespeare, who earns their living, was himself an actor (with a beard) and did his share of noise-making.", ref: "当你想到养活他们的莎士比亚本人就是个（留着胡须的）演员而且噪音制造也有他一份时，这真是绝妙的讽刺。" }
    ]
  },
  {
    day: 27,
    type: "英一",
    source: "2006 Text 2",
    zh: "旅客流并不是完全分离的。乘公交车过来的观光客经常顺道去参观华威城堡和布伦海姆宫，却通常不会去看戏，有些人甚至很惊讶地发现在斯特拉福德镇居然还有一家剧院。然而，看戏的人则除看戏之外还会设法抽出时间游览一些景点。皇家莎士比亚剧团坚称，正是看戏的人带来了小镇的大部分收入，因为他们在此过夜（有些会住四到五个晚上），将大把的钱花在酒店和餐馆中。而观光者会在夜幕降临前游览完所有地方然后离开小镇。",
    sentences: [
    { num: "①", en: "The tourist streams are not entirely separate.", ref: "旅客流并不是完全分离的。" },
    { num: "②", en: "The sightseers who come by bus - and often take in Warwick Castle and Blenheim Palace on the side -- don't usually see the plays, and some of them are even surprised to find a theatre in Stratford.", ref: "乘公交车过来的观光客经常顺道去参观华威城堡和布伦海姆宫，却通常不会去看戏，有些人甚至很惊讶地发现在斯特拉福德镇居然还有一家剧院。" },
    { num: "③", en: "However, the playgoers do manage a little sight-seeing along with their playgoing.", ref: "然而，看戏的人则除看戏之外还会设法抽出时间游览一些景点。" },
    { num: "④", en: "It is the playgoers, the RSC contends, who bring in much of the town's revenue because they spend the night (some of them four or five nights) pouring cash into the hotels and restaurants.", ref: "皇家莎士比亚剧团坚称，正是看戏的人带来了小镇的大部分收入，因为他们在此过夜（有些会住四到五个晚上），将大把的钱花在酒店和餐馆中。" },
    { num: "⑤", en: "The sightseers can take in everything and get out of town by nightfall.", ref: "而观光者会在夜幕降临前游览完所有地方然后离开小镇。" }
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
    { num: "①", en: "The townsfolk don't see it this way and the local council does not contribute directly to the subsidy of the Royal Shakespeare Company.", ref: "小镇居民并不这么认为，因而当地市政委员会也不直接出钱补贴皇家莎士比亚剧团。" },
    { num: "②", en: "Stratford cries poor traditionally.", ref: "斯特拉特福德镇历来有哭穷的传统。" },
    { num: "③", en: "Nevertheless every hotel in town seems to be adding a new wing or cocktail lounge.", ref: "然而镇上的每家旅馆似乎都在增建新的侧厅或酒吧间。" },
    { num: "④", en: "Hilton is building its own hotel there, which you may be sure will be decorated with Hamlet Hamburger Bars, the Lear Lounge, the Banquo Banqueting Room, and so forth, and will be very expensive.", ref: "希尔顿集团正在那里建造自己的酒店，你几乎可以肯定它会配备哈姆雷特汉堡吧、李尔休息室、班柯宴会包间等，而且会是非常奢华。" }
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
    { num: "①", en: "Anyway, the townsfolk can’t understand why the Royal Shakespeare Company needs a subsidy.", ref: "无论如何，当地居民都不能理解为什么皇家莎士比亚剧团需要补贴。" },
    { num: "②", en: "(The theatre has broken attendance records for three years in a row.", ref: "（剧院连续三年打破上座记录。" },
    { num: "③", en: "Last year its 1,431 seats were 94 per cent occupied all year long and this year they'll do better.)", ref: "去年全年，其 1431 个座席的上座率达到 94%，而且今年的情况会更好。" },
    { num: "④", en: "The reason, of course, is that costs have rocketed and ticket prices have stayed low.", ref: "当然，（剧院需要补贴的）原因是成本在飞涨，而票价却一直保持低位。" }
    ]
  },
  {
    day: 30,
    type: "英一",
    source: "2006 Text 2",
    zh: "大幅提价将会是一件令人蒙羞的事，因为这样做将会赶走那些作为“斯特拉福德镇最有吸引力的顾客”的年轻人。他们来这里纯粹是为了欣赏戏剧，而不是为了逛景点。虽然他们来自世界各地，但是看起来却都很相像——身材消瘦，棱角分明，表情专注，穿着牛仔裤和凉鞋，啃着圆面包，躺在剧院外的石板上过夜，等着在上午十点半售票处开门时购买预留给露宿者的 20 张坐票和 80 张站票。",
    sentences: [
    { num: "①", en: "It would be a shame to raise prices too much because it would drive away the young people who are Stratford's most attractive clientele.", ref: "大幅提价将会是一件令人蒙羞的事，因为这样做将会赶走那些作为“斯特拉福德镇最有吸引力的顾客”的年轻人。" },
    { num: "②", en: "They come entirely for the plays, not the sights.", ref: "他们来这里纯粹是为了欣赏戏剧，而不是为了逛景点。" },
    { num: "③", en: "They all seem to look alike (though they come from all over) - lean, pointed, dedicated faces, wearing jeans and sandals, eating their buns and bedding down for the night on the flagstones outside the theatre to buy the 20 seats and 80 standing-room tickets held for the sleepers and sold to them when the box office opens at 10:30 a. m.", ref: "虽然他们来自世界各地，但是看起来却都很相像——身材消瘦，棱角分明，表情专注，穿着牛仔裤和凉鞋，啃着圆面包，躺在剧院外的石板上过夜，等着在上午十点半售票处开门时购买预留给露宿者的 20 张坐票和 80 张站票。" }
    ]
  },
  {
    day: 31,
    type: "英一",
    source: "2006 Text 3",
    zh: "当史前人类到达世界的新区域时，某些奇怪的事情发生在大型动物身上：它们突然灭绝了。体型较小的物种幸存了下来。生长缓慢的大型动物容易被捕获，且迅速被猎杀直至灭绝。现在类似的事情可能正在各大洋中发生。人们多年来早已经知晓海洋正在遭受过度捕捞。而诸如兰森姆，迈尔斯和鲍里斯·沃尔姆这样的研究者所揭示的只是情势恶化到底有多快。他们研究了全世界渔场半个世纪的数据。其研究方法不是试图估算特定海域中鱼类的实际生物量（活体生物的数量），而是（估算）随着时间推移这些生物量的变化。据他们在《自然》杂志上发表的最新论文可知，一个新渔场在开发之初的 15 年中大型食肉鱼类（猎食其他动物的鱼类）的生物量平均减少了 80%。在一些长期捕鱼的地区，生物量自那之后又减少了一半。",
    sentences: [
    { num: "①", en: "When prehistoric man arrived in new parts of the world, something strange happened to the large animals: they suddenly became extinct.", ref: "当史前人类到达世界的新区域时，某些奇怪的事情发生在大型动物身上：它们突然灭绝了。" },
    { num: "②", en: "Smaller species survived.", ref: "体型较小的物种幸存了下来。" },
    { num: "③", en: "The large, slow-growing animals were easy game, and were quickly hunted to extinction.", ref: "生长缓慢的大型动物容易被捕获，且迅速被猎杀直至灭绝。" },
    { num: "④", en: "Now something similar could be happening in the oceans.", ref: "现在类似的事情可能正在各大洋中发生。" },
    { num: "⑤", en: "That the seas are being overfished has been known for years.", ref: "人们多年来早已经知晓海洋正在遭受过度捕捞。" },
    { num: "⑥", en: "What researchers such as Ransom Myers and Boris Worm have shown is just how fast things are changing.", ref: "而诸如兰森姆，迈尔斯和鲍里斯·沃尔姆这样的研究者所揭示的只是情势恶化到底有多快。" },
    { num: "⑦", en: "They have looked at half a century of data from fisheries around the world.", ref: "他们研究了全世界渔场半个世纪的数据。" },
    { num: "⑧", en: "Their methods do not attempt to estimate the actual biomass (the amount of living biological matter) of fish species in particular parts of the ocean, but rather changes in that biomass over time.", ref: "其研究方法不是试图估算特定海域中鱼类的实际生物量（活体生物的数量），而是（估算）随着时间推移这些生物量的变化。" },
    { num: "⑨", en: "According to their latest paper published in Nature, the biomass of large predators (animals that kill and eat other animals) in a new fishery is reduced on average by 80% within 15 years of the start of exploitation.", ref: "据他们在《自然》杂志上发表的最新论文可知，一个新渔场在开发之初的 15 年中大型食肉鱼类（猎食其他动物的鱼类）的生物量平均减少了 80%。" },
    { num: "⑩", en: "In some long-fished areas, it has halved again since then.", ref: "在一些长期捕鱼的地区，生物量自那之后又减少了一半。" }
    ]
  },
  {
    day: 32,
    type: "英一",
    source: "2006 Text 3",
    zh: "沃尔姆博士承认这些数据是保守的。其原因之一是捕鱼技术已经改进。当今的船只可以使用50 年前还没有的卫星和声呐技术来寻找猎物。这就意味着更高比例的海洋生物正在被捕获，因此现在和过去之间的真正差异很可能比捕捞量变化所显示出的差异更大。而且，在早期，多钩长线上本可以挂满更多的鱼。有些鱼之所以没有被捕捉，是因为没有可利用的带饵鱼钩来诱捕它们，进而导致过去的鱼类资源量被低估。此外，在使用多钩长线捕鱼的初期，许多鱼被钩住后又被鲨鱼夺走。而现在这不再是一个问题，因为鲨鱼很少出现了。",
    sentences: [
    { num: "①", en: "Dr.Worm acknowledges that these figures are conservative.", ref: "沃尔姆博士承认这些数据是保守的。" },
    { num: "②", en: "One reason for this is that fishing technology has improved.", ref: "其原因之一是捕鱼技术已经改进。" },
    { num: "③", en: "Today’s vessels can find their prey using satellites and sonar, which were not available 50 years ago.", ref: "当今的船只可以使用50 年前还没有的卫星和声呐技术来寻找猎物。" },
    { num: "④", en: "That means a higher proportion of what is in the sea is being caught, so the real difference between present and past is likely to be worse than the one recorded by changes in catch sizes.", ref: "这就意味着更高比例的海洋生物正在被捕获，因此现在和过去之间的真正差异很可能比捕捞量变化所显示出的差异更大。" },
    { num: "⑤", en: "In the early days, too, longlines would have been more saturated with fish.", ref: "而且，在早期，多钩长线上本可以挂满更多的鱼。" },
    { num: "⑥", en: "Some individuals would therefore not have been caught, since no baited hooks would have been available to trap them, leading to an underestimate of fish stocks in the past.", ref: "有些鱼之所以没有被捕捉，是因为没有可利用的带饵鱼钩来诱捕它们，进而导致过去的鱼类资源量被低估。" },
    { num: "⑦", en: "Furthermore, in the early days of longline fishing, a lot of fish were lost to sharks after they had been hooked.", ref: "此外，在使用多钩长线捕鱼的初期，许多鱼被钩住后又被鲨鱼夺走。" },
    { num: "⑧", en: "That is no longer a problem, because there are fewer sharks around now.", ref: "而现在这不再是一个问题，因为鲨鱼很少出现了。" }
    ]
  },
  {
    day: 33,
    type: "英一",
    source: "2006 Text 3",
    zh: "迈尔斯博士和沃尔姆博士认为他们的研究成果将提供一个未来管理活动必须考虑的正确基线。他们认为其数据验证了海洋生物学家就“变化基线”的一种普遍看法。这种看法就是人们未能发觉海洋中发生的巨大变化是因为他们一直只回顾过去一段相对较短时间内的情况。而这事关重大，因为理论认为当目标物种的生物量大约为其原始水平的 50%时，从渔场能够获得最大持续渔获量。大部分渔场都远低于这个水平，这是一种有害的经营方式。",
    sentences: [
    { num: "①", en: "Dr.Myers and Dr.Worm argue that their work gives a correct baseline, which future management efforts must take into account.", ref: "迈尔斯博士和沃尔姆博士认为他们的研究成果将提供一个未来管理活动必须考虑的正确基线。" },
    { num: "②", en: "They believe the data support an idea current among marine biologists, that of the“shifting baseline”.", ref: "他们认为其数据验证了海洋生物学家就“变化基线”的一种普遍看法。" },
    { num: "③", en: "The notion is that people have failed to detect the massive changes which have happened in the ocean because they have been looking back only a relatively short time into the past.", ref: "这种看法就是人们未能发觉海洋中发生的巨大变化是因为他们一直只回顾过去一段相对较短时间内的情况。" },
    { num: "④", en: "That matters because theory suggests that the maximum sustainable yield that can be cropped from a fishery comes when the biomass of a target species is about 50% of its original levels.", ref: "而这事关重大，因为理论认为当目标物种的生物量大约为其原始水平的 50%时，从渔场能够获得最大持续渔获量。" },
    { num: "⑤", en: "Most fisheries are well below that, which is a bad way to do business.", ref: "大部分渔场都远低于这个水平，这是一种有害的经营方式。" }
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
    { num: "①", en: "Many things make people think artists are weird.", ref: "许多事情使人们认为艺术家是怪异的。" },
    { num: "②", en: "But the weirdest may be this: artists’ only job is to explore emotions, and yet they choose to focus on the ones that feel bad.", ref: "但最怪异的或许是这件：艺术家唯一的工作就是探究情感，然而他们却选择聚焦于那些令人感觉糟糕的情感。" },
    { num: "③", en: "This wasn’t always so.", ref: "情况并非总是如此。" },
    { num: "④", en: "The earliest forms of art, like painting and music, are those best suited for expressing joy.", ref: "最早期的艺术形式，如绘画和音乐，是最适合表达喜悦的。" },
    { num: "⑤", en: "But somewhere from the 19th century onward, more artists began seeing happiness as meaningless, phony or, worst of all, boring, as we went from Wordsworth’s daffodils to Baudelaire’s flowers of evil.", ref: "但大约从19 世纪以来，更多的艺术家开始把幸福看作是无趣的、虚幻的、甚至是使人厌烦的情感，正如我们从华兹华斯的《水仙花》到波德莱尔的《恶之花》所体验到的一样。" }
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
    { num: "①", en: "You could argue that art became more skeptical of happiness because modern times have seen so much misery.", ref: "你可能会辩称艺术越来越质疑幸福是因为现代社会经历了如此多的苦难。" },
    { num: "②", en: "But it’s not as if earlier times didn’t know perpetual war, disaster and the massacre of innocents.", ref: "但早期社会又不是没有经历过连年战乱、天灾人祸和屠杀无辜。" },
    { num: "③", en: "The reason, in fact, may be just the opposite: there is too much damn happiness in the world today.", ref: "事实上，原因可能恰恰相反：当今世界有太多令人作呕的幸福。" },
    { num: "④", en: "After all, what is the one modern form of expression almost completely dedicated to depicting happiness?", ref: "别忘了，几乎完全致力于描绘幸福的唯一现代表达形式是什么？" },
    { num: "⑤", en: "Advertising.", ref: "是广告。" },
    { num: "⑥", en: "The rise of anti-happy art almost exactly tracks the emergence of mass media, and with it, a commercial culture in which happiness is not just an ideal but an ideology.", ref: "反幸福艺术的兴起几乎完全与大众传媒同步，与之相伴而生的还有一种商业文化，在这种文化中幸福不仅是一种理想，更是一种意识形态。" }
    ]
  },
  {
    day: 36,
    type: "英一",
    source: "2006 Text 4",
    zh: "早期时代的人们被苦难提示信息团团包围。他们工作到筋疲力尽，生活几乎没有任何保障，且年纪尚轻便会逝去。在西方，在大众传播和教育普及之前，最强有力的大众传媒是教堂，在这里，信徒们会被提醒：他们的灵魂处于危险之中，他们有朝一日将沦为腐尸被蠕虫啮噬。鉴于这一切，他们根本不需要艺术也成为一件恼人之物。",
    sentences: [
    { num: "①", en: "People in earlier eras were surrounded by reminders of misery.", ref: "早期时代的人们被苦难提示信息团团包围。" },
    { num: "②", en: "They worked until exhausted, lived with few protections and died young.", ref: "他们工作到筋疲力尽，生活几乎没有任何保障，且年纪尚轻便会逝去。" },
    { num: "③", en: "In the West, before mass communication and literacy, the most powerful mass medium was the church, which reminded worshippers that their souls were in danger and that they would someday be meat for worms.", ref: "在西方，在大众传播和教育普及之前，最强有力的大众传媒是教堂，在这里，信徒们会被提醒：他们的灵魂处于危险之中，他们有朝一日将沦为腐尸被蠕虫啮噬。" },
    { num: "④", en: "Given all this, they did not exactly need their art to be a bummer too.", ref: "鉴于这一切，他们根本不需要艺术也成为一件恼人之物。" }
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
    { num: "①", en: "Today the messages the average Westerner is surrounded with are not religious but commercial, and forever happy.", ref: "如今围绕普通西方人的信息不是宗教的，而是商业的，且永远都是幸福的。" },
    { num: "②", en: "Fast-food eaters, news anchors, text messengers, all smiling, smiling, smiling.", ref: "快餐食客、新闻主播、发短信者，都在微笑、微笑、微笑。" },
    { num: "③", en: "Our magazines feature beaming celebrities and happy families in perfect homes.", ref: "我们的杂志特载满面春光的名人以及完美住宅里的幸福家庭。" },
    { num: "④", en: "And since these messages have an agenda—to lure us to open our wallets—they make the very idea of happiness seem unreliable.", ref: "由于这些信息有着特定的目的——诱使我们打开钱包——它们使得“幸福”这一概念看起来不可靠。" },
    { num: "⑤", en: "“Celebrate!”", ref: "“欢庆吧！" },
    { num: "⑥", en: "commanded the ads for the arthritis drug Celebrex, before we found out it could increase the risk of heart attacks.", ref: "关节炎药西乐葆的广告这样鼓动道，之后我们才发现，它会增加心脏病的发病风险。" },
    { num: "⑦", en: "But what we forget—what our economy depends on us forgetting—is that happiness is more than pleasure without pain.", ref: "但是我们所忘记的——我们的经济依赖的是我们的忘记——是：幸福并非是没有痛苦的快乐。" },
    { num: "⑧", en: "The things that bring the greatest joy carry the greatest potential for loss and disappointment.", ref: "带来最大欢乐的东西很可能带来最大的损失和失望。" },
    { num: "⑨", en: "Today, surrounded by promises of easy happiness, we need art to tell us, as religion once did, Memento mori: remember that you will die, that everything ends, and that happiness comes not in denying this but in living with it.", ref: "如今，周围到处都是对唾手可得的幸福的承诺，我们需要艺术来告诫我们，正如宗教曾经告诉我们，人终有一死，万事皆会结束，幸福不在于否定这一点而在于忍受它。" },
    { num: "⑩", en: "It’s a message even more bitter than a clove cigarette, yet, somehow, a breath of fresh air.", ref: "这是甚至比丁香烟还要苦涩的启示，但不知何故，却带来了一缕清新的空气。" }
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
    { num: "①", en: "If you were to examine the birth certificates of every soccer player in 2006’s World Cup tournament, you would most likely find a noteworthy quirk: elite soccer players are more likely to have been born in the earlier months of the year than in the late months.", ref: "如果查看一下 2006 年世界杯赛所有足球运动员的出生证，你很可能会发现一件引人注意的奇事：出类拔萃的足球运动员更可能出生在一年中的头几个月而非后几个月。" },
    { num: "②", en: "If you then examined the European national youth teams that feed the World Cup and professional ranks, you would find this strange phenomenon to be ever more pronounced.", ref: "如果再看看为世界杯和职业球队输送人才的欧洲各国国家青年队（队员出生证），你会发现这一奇怪现象甚至更为显著。" },
    { num: "③", en: "What might account for this strange phenomenon?", ref: "这一奇怪现象可能的成因是什么呢？" },
    { num: "④", en: "Here are a few guesses: a) certain astrological signs confer superior soccer skills; b) winter-born babies tend to have higher oxygen capacity, which increases soccer stamina; c) soccer-mad parents are more likely to conceive children in springtime, at the annual peak of soccer mania; d) none of the above.", ref: "以下是几种猜测：a）某些星座赐予球员高超的足球技能；b）冬季出生的婴孩往往具有更高的血液携氧能力，这会增加踢足球时的耐力；c）痴速足球的父母更可能在春天，也即每年足球狂热的巅峰时期受孕；d）以上都不是。" }
    ]
  },
  {
    day: 39,
    type: "英一",
    source: "2007 Text 1",
    zh: "安德斯·艾利克森，佛罗里达州立大学一位 58 岁的心理学教授，称他坚信“以上都不对”。艾利克森在瑞典长大，起初攻读核能工程学，直到他意识到如果转学心理学，会有更多机会从事自己的研究。他的首次实验，大约在 30 年前，与记忆力相关：训练一个人听一组随机数字，随后进行复述。“在约 20 个小时训练之后，第一位被试者的数字记忆跨度从 7 个增加至 20 个，”艾利克森四忆道，“他不断地进步，约 200 个小时训练之后，他能记住 80 多个数字。”",
    sentences: [
    { num: "①", en: "Anders Ericsson, a 58-year-old psychology professor at Florida State University, says he believes strongly in “none of the above.”", ref: "安德斯·艾利克森，佛罗里达州立大学一位 58 岁的心理学教授，称他坚信“以上都不对”。" },
    { num: "②", en: "Ericsson grew up in Sweden, and studied nuclear engineering until he realized he would have more opportunity to conduct his own research if he switched to psychology.", ref: "艾利克森在瑞典长大，起初攻读核能工程学，直到他意识到如果转学心理学，会有更多机会从事自己的研究。" },
    { num: "③", en: "His first experiment, nearly 30 years ago, involved memory: training a person to hear and then repeat a random series of numbers.", ref: "他的首次实验，大约在 30 年前，与记忆力相关：训练一个人听一组随机数字，随后进行复述。" },
    { num: "④", en: "“With the first subject, after about 20 hours of training, his digit span had risen from 7 to 20,” Ericsson recalls. “He kept improving, and after about 200 hours of training he had risen to over 80 numbers.”", ref: "“在约 20 个小时训练之后，第一位被试者的数字记忆跨度从 7 个增加至 20 个，”艾利克森四忆道，“他不断地进步，约 200 个小时训练之后，他能记住 80 多个数字。”" }
    ]
  },
  {
    day: 40,
    type: "英一",
    source: "2007 Text 1",
    zh: "这次成功，加上后续的表明记忆力本身并非由基因决定的研究，使得艾利克森得出结论：记忆行为与其说是一种直觉活动，不如说是一种认知活动。换句话说，不论两个人在记忆能力方面表现出什么先天性差异，这些差异都被个人“编码”信息能力的强弱所掩盖。艾利克森断定，学习有目的地编码信息的最佳方法是一个被称为“刻意练习”的过程。“刻意练习”需要的不仅仅是简单地重复任务，确切地讲，它需要制定明确目标、获取即时反馈并且要技巧与结果并重。",
    sentences: [
    { num: "①", en: "This success, coupled with later research showing that memory itself is not genetically determined, led Ericsson to conclude that the act of memorizing is more of a cognitive exercise than an intuitive one.", ref: "这次成功，加上后续的表明记忆力本身并非由基因决定的研究，使得艾利克森得出结论：记忆行为与其说是一种直觉活动，不如说是一种认知活动。" },
    { num: "②", en: "In other words, whatever inborn differences two people may exhibit in their abilities to memorize, those differences are swamped by how well each person “encodes” the information.", ref: "换句话说，不论两个人在记忆能力方面表现出什么先天性差异，这些差异都被个人“编码”信息能力的强弱所掩盖。" },
    { num: "③", en: "And the best way to learn how to encode information meaningfully, Ericsson determined, was a process known as deliberate practice.", ref: "艾利克森断定，学习有目的地编码信息的最佳方法是一个被称为“刻意练习”的过程。" },
    { num: "④", en: "Deliberate practice entails more than simply repeating a task. Rather, it involves setting specific goals, obtaining immediate feedback and concentrating as much on technique as on outcome.", ref: "“刻意练习”需要的不仅仅是简单地重复任务，确切地讲，它需要制定明确目标、获取即时反馈并且要技巧与结果并重。" }
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
    { num: "①", en: "Ericsson and his colleagues have thus taken to studying expert performers in a wide range of pursuits, including soccer.", ref: "艾利克森和他的同事由此开始 于研究众多领域（包括足球）的出色表现者。" },
    { num: "②", en: "They gather all the data they can, not just performance statistics and biographical details but also the results of their own laboratory experiments with high achievers.", ref: "他们收集能够收集到的所有资料，不仅包括工作表现统计数据和生平详细资料，还包括他们在自己实验室里对杰出人才所做实验的结果。" },
    { num: "③", en: "Their work makes a rather startling assertion: the trait we commonly call talent is highly overrated.", ref: "他们的研究结论相当令人震惊：我们通常称之为“天赋”的这一特质被过于高估了。" },
    { num: "④", en: "Or, put another way, expert performers—whether in memory or surgery, ballet or computer programming—are nearly always made, not born.", ref: "或者，换句话说，不管是在记忆力还是外科手术领域，是在芭蕾舞还是在计算机编程方面，表现出色的人几乎都是造就的，而不是天生的。" }
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
    zh: "在过去几年中，报纸周日副刊《大观》开设了一版名为“问问玛丽莲”的特色专栏。人们被邀请向玛丽莲·沃斯·莎凡提问，她在 10 岁时测得的智力水平相当于普通人 23 岁左右，也就是智商为 228，这是有记录以来的最高分数。IQ 测试要求你完成文宇和视觉类推、想象纸张经折叠和剪切后的形状、推导数字序列，以及其他类似的任务。因此，莎凡能巧妙应对（智商为 100 的）普通人提出的诸如“爱与喜爱有何区别”或“运气和巧合的本质是什么”这类问题,这有点令人费解。想象物体（形状）和破解数值模式的能力如何能使人解答那些曾难倒一些最优秀诗人和哲学家的问题，这一点难以理解。显然，智力不止包含一次测试的一个得分。那么什么才叫“聪明”呢？智力有多少可以被明确（测知）？我们从神经学、遗传学、计算机科学和其他领域中又能对智力了解多少呢?",
    sentences: [
    { num: "①", en: "For the past\u0003several years, the Sunday newspaper supplement Parade has featured a column called “Ask Marilyn.”", ref: "在过去几年中，报纸周日副刊《大观》开设了一版名为“问问玛丽莲”的特色专栏。" },
    { num: "②", en: "People are invited to query Marilyn vos Savant, who at age 10 had tested at a mental level of someone about 23 years old;", ref: "人们被邀请向玛丽莲·沃斯·莎凡提问，她在 10 岁时测得的智力水平相当于普通人 23 岁左右，也就是智商为 228，这是有记录以来的最高分数。" },
    { num: "③", en: "that gave her an IQ of 228—the highest score ever recorded.", ref: "IQ 测试要求你完成文宇和视觉类推、想象纸张经折叠和剪切后的形状、推导数字序列，以及其他类似的任务。" },
    { num: "④", en: "IQ tests ask you to complete verbal and visual analogies, to envision paper after it has been folded and cut, and to deduce numerical sequences, among other similar tasks.", ref: "因此，莎凡能巧妙应对（智商为 100 的）普通人提出的诸如“爱与喜爱有何区别”或“运气和巧合的本质是什么”这类问题,这有点令人费解。" },
    { num: "⑤", en: "So it is a bit confusing when vos Savant fields such queries from the average Joe (whose IQ is 100) as, What’s the difference between love and fondness? Or what is the nature of luck and coincidence?", ref: "想象物体（形状）和破解数值模式的能力如何能使人解答那些曾难倒一些最优秀诗人和哲学家的问题，这一点难以理解。" },
    { num: "⑥", en: "It’s not obvious how the capacity to visualize objects and to figure out numerical patterns suits one to answer questions that have eluded some of the best poets and philosophers.", ref: "显然，智力不止包含一次测试的一个得分。" },
    { num: "⑦", en: "Clearly, intelligence encompasses more than a score on a test.", ref: "那么什么才叫“聪明”呢？" },
    { num: "⑧", en: "Just what does it mean to be smart?", ref: "智力有多少可以被明确（测知）？" },
    { num: "⑨", en: "How much of intelligence can be specified, and how much can we learn about it from neurology, genetics, computer science and other fields?", ref: "我们从神经学、遗传学、计算机科学和其他领域中又能对智力了解多少呢?" }
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
    { num: "①", en: "The defining term of intelligence in humans still seems to be the IQ score, even though IQ tests are not given as often as they used to be.", ref: "尽管如今 IQ 测试已经不像以前那么频繁地被使用，但 IQ 分数似乎仍是定义人类智力的术语。" },
    { num: "②", en: "The test comes primarily in two forms: the Stanford-Binet Intelligence Scale and the Wechsler Intelligence Scales (both come in adult and children’s version).", ref: "IQ 测试主要有两种形式：斯坦福一比纳智力量表和韦克斯勒智力量表（二者都有成人版和儿童版）。" },
    { num: "③", en: "Generally costing several hundred dollars, they are usually given only by psychologists, although variations of them populate bookstores and the World Wide Web.", ref: "这两种测试形式费用一般为几百美元，通常只由心理学家提供，不过他们的改编版本在书店和互联网上随处可见。" },
    { num: "④", en: "Superhigh scores like vos Savant’s are no longer possible, because scoring is now based on a statistical population distribution among age peers, rather than simply dividing the mental age by the chronological age and multiplying by 100.", ref: "像莎凡那样的超高分数不可能再出现，因为现在分数计算是以同龄群体在统计学意义上的人口分布为基础的，而不是简单地用智力年龄除以生理年龄再乘以 100。" },
    { num: "⑤", en: "Other standardized tests, such as the Scholastic Assessment Test (SAT) and the Graduate Record Exam (GRE), capture the main aspects of IQ tests.", ref: "其他标准化测试，比如学术评估测验（SAT）和研究生入学考试（GRE），都充分体现了 IQ 测试的主要特点。" }
    ]
  },
  {
    day: 44,
    type: "英一",
    source: "2007 Text 2",
    zh: "罗伯特·J·斯特恩伯格指出，这类标准化测试也许不能评估在学业和生活中取得成功所必需的所有重要因素。斯特恩伯格在他的《智力测试有多智能?》一文中指出传统测试能够对分析能力和语言能力做出最佳评估，但不能评估创造能力和实践知识，而这两个因素对于解决问题和在生活中取得成功也至关重要。此外，一旦受试群体或环境发生变化，IQ 测试不一定能做出准确预测。研究发现，当（受试者）在压力小的情况下进行测试时，IQ 能预示领导能力（的高低）；但是在压力大的情况下，IQ 与领导能力负相关——也就是说，根据智商预测出的领导能力与实际情况相反。任何熬过“学术能力评估测试”的人都可以证明，应试技巧也很重要，无论是知道何时应该猜测或是（知道）何题应该跳过。",
    sentences: [
    { num: "①", en: "Such standardized tests may not assess all the important elements necessary to succeed in school and in life, argues Robert J. Sternberg.", ref: "罗伯特·J·斯特恩伯格指出，这类标准化测试也许不能评估在学业和生活中取得成功所必需的所有重要因素。" },
    { num: "②", en: "In his article “How Intelligent Is Intelligence Testing?” , Sternberg notes that traditional tests best assess analytical and verbal skills but fail to measure creativity and practical knowledge, components also critical to problem solving and life success.", ref: "斯特恩伯格在他的《智力测试有多智能?》一文中指出传统测试能够对分析能力和语言能力做出最佳评估，但不能评估创造能力和实践知识，而这两个因素对于解决问题和在生活中取得成功也至关重要。" },
    { num: "③", en: "Moreover, IQ tests do not necessarily predict so well once populations or situations change.", ref: "此外，一旦受试群体或环境发生变化，IQ 测试不一定能做出准确预测。" },
    { num: "④", en: "Research has found that IQ predicted leadership skills when the tests were given under low-stress conditions, but under high-stress conditions, IQ was negatively correlated with leadership—that is, it predicted the opposite.", ref: "研究发现，当（受试者）在压力小的情况下进行测试时，IQ 能预示领导能力（的高低）；但是在压力大的情况下，IQ 与领导能力负相关——也就是说，根据智商预测出的领导能力与实际情况相反。" },
    { num: "⑤", en: "Anyone who has toiled through SAT will testify that test-taking skill also matters, whether it’s knowing when to guess or what questions to skip.", ref: "任何熬过“学术能力评估测试”的人都可以证明，应试技巧也很重要，无论是知道何时应该猜测或是（知道）何题应该跳过。" }
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
    zh: "在过去一代人的时间里，原本依靠努力工作和公乎竞争便能保持自身经济安稳的美国中产阶级家庭已被经济风险和新的现实彻底改变现在，一张粉色小纸条（解雇通知书），一个恶性诊断结果，或者离散的配偶，都可以使一个家庭从殷实的中产阶级在几个月内沧为新贫阶层。",
    sentences: [
    { num: "①", en: "During the past generation, the American middle-class family that once could count on hard work and fair play to keep itself financially secure has been transformed by economic risk and new realities.", ref: "在过去一代人的时间里，原本依靠努力工作和公乎竞争便能保持自身经济安稳的美国中产阶级家庭已被经济风险和新的现实彻底改变。" },
    { num: "②", en: "Now a pink slip, a bad diagnosis, or a disappearing spouse can reduce a family from solidly middle class to newly poor in a few months.", ref: "现在，一张粉色小纸条（解雇通知书），一个恶性诊断结果，或者离散的配偶，都可以使一个家庭从殷实的中产阶级在几个月内沧为新贫阶层。" }
    ]
  },
  {
    day: 46,
    type: "英一",
    source: "2007 Text 3",
    zh: "在仅仅一代人的时间里，数百万母亲已出去工作，改变了基本的家庭经济（模式），学者、政策制定者以及各路评论家都已反复讨论这些变化的社会意义，但几乎没人仔细研究过其副作用：家庭风险也提高了。如今家庭的开支已达这种新双薪状态的极限结果，他们失去了经济受挫时期曾经拥有的“降落伞”——一个在家庭经济支柱失业或生病时可以走进职场的候补赚钱者（通常是母亲）。这种“附加的劳动者效应”能够增强失业保险或伤残保险所提供的安全保障网帮助家庭渡过难关。但如今，家庭时运遭到的破坏再也不能通过原本赋闲在家的另一半获得的额外收入得以弥补。",
    sentences: [
    { num: "①", en: "In just one generation, millions of mothers have gone to work,transforming basic family economics. Scholars, policymakers, and critics of all stripes have debated the social implications of these changes, but few have looked at the side effect: family risk has risen as well.", ref: "在仅仅一代人的时间里，数百万母亲已出去工作，改变了基本的家庭经济（模式），学者、政策制定者以及各路评论家都已反复讨论这些变化的社会意义，但几乎没人仔细研究过其副作用：家庭风险也提高了。" },
    { num: "②", en: "Today’s families have budgeted to the limits of their\u0003new two-paycheck status. As a result, they have lost the parachute they once had in times of financial setback—a back-up earner (usually Mom) who could go into the workforce if the primary earner got laid off or fell sick.", ref: "如今家庭的开支已达这种新双薪状态的极限结果，他们失去了经济受挫时期曾经拥有的“降落伞”——一个在家庭经济支柱失业或生病时可以走进职场的候补赚钱者（通常是母亲）。" },
    { num: "③", en: "This “added-worker effect” could support the safety net offered by unemployment insurance or disability insurance to help families weather bad times.", ref: "这种“附加的劳动者效应”能够增强失业保险或伤残保险所提供的安全保障网帮助家庭渡过难关。" },
    { num: "④", en: "But today, a disruption to family fortunes can no longer be made up with extra income from an otherwise-stay-at-home partner.", ref: "但如今，家庭时运遭到的破坏再也不能通过原本赋闲在家的另一半获得的额外收入得以弥补。" }
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
    zh: "与此同时，家庭被要求在退体收入方面承担（比以前）大得多的风险。钢铁工人、航空公司雇员以及现在汽车行业的员工正在加入数百万家庭，必须担忧利率、股市波动以及退体全不足以养老这一严酷现实。去年的大半年之中，布什总统领导了将社会保障体系变成储蓄账户模式的改革运动，（在这种模式下，）退休人员的大部分或全部的“有保障的收入”变成了“依赖投资收益的收入”。对于较年轻的家庭来说，境况并没有好出丝毫。医疗保健的绝对成本以及其中家庭承担的份额都已提高——且新近流行的健康储蓄计划正从国会大厅蔓延到沃尔玛员工那里，随之而来的是比过去高出许多的医疗保险免赔额，以及家庭未来的医疗保健所面临的大量新增投资风险。甚至人口统计数据都对中产阶级家庭不利，因为（据统计）家庭中出现年老力衰的父（母）——以及随之而来的体力和经济援助需要——的几率在仅仅一代人的时间里就猛涨到原来的八倍。",
    sentences: [
    { num: "①", en: "During the same period, families have been asked to absorb much more risk in their retirement income.", ref: "与此同时，家庭被要求在退体收入方面承担（比以前）大得多的风险。" },
    { num: "②", en: "Steelworkers, airline employees, and now those in the auto industry are joining millions of families who must worry about interest rates, stock market fluctuation, and the harsh reality that they may outlive their retirement money.", ref: "钢铁工人、航空公司雇员以及现在汽车行业的员工正在加入数百万家庭，必须担忧利率、股市波动以及退体全不足以养老这一严酷现实。" },
    { num: "③", en: "For much of the past year, President Bush campaigned to move Social Security to a savings-account model, with retirees trading much or all of their guaranteed payments for payments depending on investment returns.", ref: "去年的大半年之中，布什总统领导了将社会保障体系变成储蓄账户模式的改革运动，（在这种模式下，）退休人员的大部分或全部的“有保障的收入”变成了“依赖投资收益的收入”。" },
    { num: "④", en: "For younger families, the picture is not any better.", ref: "对于较年轻的家庭来说，境况并没有好出丝毫。" },
    { num: "⑤", en: "Both the absolute cost of healthcare and the share of it borne by families have risen—and newly fashionable health-savings plans are spreading from legislative halls to Wal-Mart workers, with much higher deductibles and a large new dose of investment risk for families’ future healthcare.", ref: "医疗保健的绝对成本以及其中家庭承担的份额都已提高——且新近流行的健康储蓄计划正从国会大厅蔓延到沃尔玛员工那里，随之而来的是比过去高出许多的医疗保险免赔额，以及家庭未来的医疗保健所面临的大量新增投资风险。" },
    { num: "⑥", en: "Even demographics are working against the middle class family, as the odds of having a weak elderly parent—and all the attendant need for physical and financial assistance—have jumped eightfold in just one generation.", ref: "甚至人口统计数据都对中产阶级家庭不利，因为（据统计）家庭中出现年老力衰的父（母）——以及随之而来的体力和经济援助需要——的几率在仅仅一代人的时间里就猛涨到原来的八倍。" }
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
    zh: "可以理解，从中产阶级家庭的角度看，上述许多现象看起来远不像是履行更多经济责任的机会，而更像是以骇人的增速将全融风险大规模转嫁到他们已经不堪重负的肩膀上。经济上的不良后果已经显现，政治影响也不会太远了。",
    sentences: [
    { num: "①", en: "From the middle-class family perspective, much of this, understandably, looks far less like an opportunity to exercise more financial responsibility, and a good deal more like a frightening acceleration of the wholesale shift of financial risk onto their already overburdened shoulders.", ref: "可以理解，从中产阶级家庭的角度看，上述许多现象看起来远不像是履行更多经济责任的机会，而更像是以骇人的增速将全融风险大规模转嫁到他们已经不堪重负的肩膀上。" },
    { num: "②", en: "The financial fallout has begun, and the political fallout may not be far behind.", ref: "经济上的不良后果已经显现，政治影响也不会太远了。" }
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
    zh: "不雨则已，雨则倾盆。正值老板、董事会们总算解决了最为棘手的财务和合规问题，并且改善了薄弱的公司治理之际，一个新的问题又可能为他们惹来——尤其是在美国——那种不可避免地使管理层受重罚的负面头条，这个问题就是：数据不安全此前，信息保护一直是由古怪而又低级的信息技术员工来负责，并且被看作只是诸如银行、电信、航空旅行这类拥有大量数据的行业才关注的问题，而现在却高居各行业老板的议程表之首。",
    sentences: [
    { num: "①", en: "It never rains but it pours.", ref: "不雨则已，雨则倾盆。" },
    { num: "②", en: "Just as bosses and boards have finally sorted out their worst accounting and compliance troubles, and improved their feeble corporation governance, a new problem threatens to earn them—especially in America—the sort of nasty headlines that inevitably lead to heads rolling in the executive suite: data insecurity.", ref: "正值老板、董事会们总算解决了最为棘手的财务和合规问题，并且改善了薄弱的公司治理之际，一个新的问题又可能为他们惹来——尤其是在美国——那种不可避免地使管理层受重罚的负面头条，这个问题就是：数据不安全。" },
    { num: "③", en: "Left, until now, to odd, low-level IT staff to put right, and seen as a concern only of data-rich industries such as banking, telecoms and air travel, information protection is now high on the boss’s agenda in businesses of every variety.", ref: "此前，信息保护一直是由古怪而又低级的信息技术员工来负责，并且被看作只是诸如银行、电信、航空旅行这类拥有大量数据的行业才关注的问题，而现在却高居各行业老板的议程表之首。" }
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
    { num: "①", en: "Several massive leakages of customer and employee data this year—from organizations as diverse as Time Warner, the American defense contractor Science Applications International Corp and even the University of California, Berkeley—have left managers hurriedly peering into their intricate IT systems and business processes in search of potential vulnerabilities.", ref: "今年几起重大的客户和员工数据泄露事件——发生于各类机构里，如时代华纳公司、美国国防项目承包商科学应用国际公司、甚至加州大学伯克利分校——使得管理者们慌忙检查自身复杂精细的信息技术系统和业务流程，以寻找潜在的漏洞。" }
    ]
  },
  {
    day: 51,
    type: "英一",
    source: "2007 Text 4",
    zh: "斯坦福大学商学院的海姆·孟德尔森说:“数据正在变成一种资产，与任何其他资产一样，它也需要受到保护。保护客户数据的能力是（保证）市场价值的关键，董事会应当为了股东的利益对市场价值负责。”的确，正如有一般公认会计原则（GAAP）的概念一样，或许现在是该制定一般公认安全原则（GAAP）的时候了，纽约哥伦比亚大学商学院的伊菜·诺姆这样建议道。他指出：“为（数据）安全、冗余以及恢复设立恰当的投资标准是个管理问题，而不是技术问题。”",
    sentences: [
    { num: "①", en: "“Data is becoming an asset which needs to be guarded as much as any other asset,” says Haim Mendelson of Stanford University’s business school.", ref: "斯坦福大学商学院的海姆·孟德尔森说:“数据正在变成一种资产，与任何其他资产一样，它也需要受到保护。" },
    { num: "②", en: "“The ability to guard customer data is the key to market value, which the board is responsible for on behalf of shareholders”.", ref: "保护客户数据的能力是（保证）市场价值的关键，董事会应当为了股东的利益对市场价值负责。" },
    { num: "③", en: "Indeed, just as there is the concept of Generally Accepted Accounting Principles (GAAP), perhaps it is time for GASP, Generally Accepted Security Practices, suggested Eli Noam of New York’s Columbia Business School.", ref: "的确，正如有一般公认会计原则（GAAP）的概念一样，或许现在是该制定一般公认安全原则（GAAP）的时候了，纽约哥伦比亚大学商学院的伊菜·诺姆这样建议道。" },
    { num: "④", en: "“Setting the proper investment level for security, redundancy, and recovery is a management issue, not a technical one,” he says.", ref: "他指出：“为（数据）安全、冗余以及恢复设立恰当的投资标准是个管理问题，而不是技术问题。”" }
    ]
  },
  {
    day: 52,
    type: "英一",
    source: "2007 Text 4",
    zh: "难以理解的是，这竟然令所有的老板们都大吃一惊。无疑的是，即使最愚笨的管理人员也应该会清楚地知道：信任，也即经济资产中最具价值的东西，很容易遭到破坏而修复起来代价高昂；没有什么事情比企业任由个人敏感信息落入别有用心的人手中更能破坏信任的了。",
    sentences: [
    { num: "①", en: "The mystery is that this should come as a surprise to any boss.", ref: "难以理解的是，这竟然令所有的老板们都大吃一惊。" },
    { num: "②", en: "Surely it should be obvious to the dimmest executive that trust, that most valuable of economic assets, is easily destroyed and hugely expensive to restore—and that few things are more likely to destroy trust than a company letting sensitive personal data get into the wrong hands.", ref: "无疑的是，即使最愚笨的管理人员也应该会清楚地知道：信任，也即经济资产中最具价值的东西，很容易遭到破坏而修复起来代价高昂；没有什么事情比企业任由个人敏感信息落入别有用心的人手中更能破坏信任的了。" }
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
    { num: "①", en: "The current state of affairs may have been encouraged—though not justified—by the lack of legal penalty (in America, but not Europe) for data leakage.", ref: "（美国，而不是欧洲）欠缺针对数据泄露的法律惩处，这种情况虽不至于证明当前事态合理，但却可能助长其发展。" },
    { num: "②", en: "Until California recently passed a law, American firms did not have to tell anyone, even the victim, when data went astray.", ref: "加州最近通过了一项法律，在此之前，美国的公司在数据丢失时无需通知任何人，甚至是受害者本人。" },
    { num: "③", en: "That may change fast: lots of proposed data-security legislation is now doing the rounds in Washington, D.C. Meanwhile, the theft of information about some 40 million credit-card accounts in America, disclosed on th June 17 , overshadowed a hugely important decision a day earlier by America’s Federal Trade Commission (FTC) that puts corporate America on notice that regulators will act if firms fail to provide adequate data security.", ref: "这种情况可能很快就会改变：大量有关数据安全的立法提案正在国会接受审议。与此同时，美国 6 月 17 日披露的一起涉及大约 4000 万信用卡账户的信息失窃案，又使得美国联邦贸易委员会头一天（16 日）做出的一项极为重大的决议——该决议警告美国商界，如果公司不能充分保障数据的安全，那么监管机构就会采取措施——颜面尽失。" }
    ]
  },
  {
    day: 54,
    type: "英一",
    source: "2008 Text 1",
    zh: "尽管女性在现代生活中的不少领城仍在努力追赶男性，但至少在一个不利的方面女性似乎遥遥领先。据纽约退伍军人管理医院精神科主任医师耶胡达博士称，“相比男性，女性在应对压力时特别容易患抑郁症和焦虑症”。对动物和人的研究都表明性激素会以某种方式影响压力反应，导致处于压力下的雌性比处于同等条件下的雄性分泌更多触发不良反应的化学物质。其中几项研究显示，如果将承受巨大压力的难鼠的卵巢（雌性生殖器官）切除，她们的化学反应变得和雄鼠相当。",
    sentences: [
    { num: "①", en: "While still catching-up to men in some spheres of modern life, women appear to be way ahead in at least one undesirable category.", ref: "尽管女性在现代生活中的不少领城仍在努力追赶男性，但至少在一个不利的方面女性似乎遥遥领先。" },
    { num: "②", en: "“Women are particularly susceptible to developing depression and anxiety disorders in response to stress compared to men,” according to Dr. Yehuda, chief psychiatrist at New York’s Veteran’s Administration Hospital.", ref: "据纽约退伍军人管理医院精神科主任医师耶胡达博士称，“相比男性，女性在应对压力时特别容易患抑郁症和焦虑症”。" },
    { num: "③", en: "Studies of both animals and humans have shown that sex hormones somehow affect the stress response, causing females under stress to produce more of the trigger chemicals than do males under the same conditions.", ref: "对动物和人的研究都表明性激素会以某种方式影响压力反应，导致处于压力下的雌性比处于同等条件下的雄性分泌更多触发不良反应的化学物质。" },
    { num: "④", en: "In several of the studies, when stressed-out female rats had their ovaries (the female reproductive organs) removed, their chemical responses became equal to those of the males.", ref: "其中几项研究显示，如果将承受巨大压力的难鼠的卵巢（雌性生殖器官）切除，她们的化学反应变得和雄鼠相当。" }
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
    zh: "加重女性更多压力化学物质剂量的，是她们增多的压力“机会”。耶胡达博士说“未必是女性不能同样地应付压力。只是她们不得不应付多得多的压力。她说道，“女性忍受压力的能力甚至可能超过男性，只是她们需要应付如此之多的事，以致她们精疲力竭得更明显且更快。”耶胡达博士还提到两性间的另一种差别。“我认为女性面临的各种事情往往更具长期性或反复性。男性去打仗，面临的是战斗压力。他们面临更多的是偶尔的身体上的暴力行为。女性面临的各种人际间暴力往往是在家庭环境中，不幸的是这种暴力来自于父母或其他家庭成员，而且往往不是一次了事。这些长久关系带来的折磨可能是极具毁灭性的”。",
    sentences: [
    { num: "①", en: "Adding to a woman’s increased dose of stress chemicals, are her increased “opportunities” for stress.", ref: "加重女性更多压力化学物质剂量的，是她们增多的压力“机会”。" },
    { num: "②", en: "“It’s not necessarily that women don’t cope as well.", ref: "耶胡达博士说“未必是女性不能同样地应付压力。" },
    { num: "③", en: "It’s just that they have so much more to cope with,” says Dr. Yehuda.", ref: "只是她们不得不应付多得多的压力。" },
    { num: "④", en: "“Their capacity for tolerating stress may even be greater than men’s,” she observes, “it’s just that they’re dealing with so many more things that they become worn out from it more visibly and sooner.”", ref: "她说道，“女性忍受压力的能力甚至可能超过男性，只是她们需要应付如此之多的事，以致她们精疲力竭得更明显且更快。" },
    { num: "⑤", en: "Dr. Yehuda notes another difference between the sexes.", ref: "耶胡达博士还提到两性间的另一种差别。" },
    { num: "⑥", en: "“I think that the kinds of things that women are exposed to tend to be in more of a chronic or repeated nature.", ref: "“我认为女性面临的各种事情往往更具长期性或反复性。" },
    { num: "⑦", en: "Men go to war and are exposed to combat stress.", ref: "男性去打仗，面临的是战斗压力。" },
    { num: "⑧", en: "Men are exposed to more acts of random physical violence.", ref: "他们面临更多的是偶尔的身体上的暴力行为。" },
    { num: "⑨", en: "The kinds of interpersonal violence that women are exposed to tend to be in domestic situations, by, unfortunately, parents or other family members, and they tend not to be one-shot deals.", ref: "女性面临的各种人际间暴力往往是在家庭环境中，不幸的是这种暴力来自于父母或其他家庭成员，而且往往不是一次了事。" },
    { num: "⑩", en: "The wear-and-tear that comes from these longer relationships can be quite devastating.”", ref: "这些长久关系带来的折磨可能是极具毁灭性的”。" }
    ]
  },
  {
    day: 56,
    type: "英一",
    source: "2008 Text 1",
    zh: "阿德琳·阿尔瓦雷兹十八岁结婚并生有一子，但她却坚决要完成大学学业。“为了拿到大学文凭我拼命努力。我的生活极其不如意，以至于我只有通过上学、取得进步并做得更好以摆脱现实困境。”后来，她的婚姻结束，她成了单身母亲。“照顾一个十来岁的孩子、工作、交房租、付车款、还要偿还债务，这是最辛苦的事情。我过着勉强糊口的生活。”并不是每个人都承受着阿德琳·阿尔瓦雷兹描述的这种巨大的长期性压力。但如今大多数女性都担负着许多责任，几乎没有放松的时候，因此感到焦虑。阿尔瓦需兹的经历说明在压力威胁到你的健康和身体机能之前寻求途径缓解压力是相当重要的。",
    sentences: [
    { num: "①", en: "Adeline Alvarez married at 18 and gave birth to a son, but was determined to finish college.", ref: "阿德琳·阿尔瓦雷兹十八岁结婚并生有一子，但她却坚决要完成大学学业。" },
    { num: "②", en: "“I struggled a lot to get the college degree.", ref: "“为了拿到大学文凭我拼命努力。" },
    { num: "③", en: "I was living in so much frustration that that was my escape, to go to school, and get ahead and do better.”", ref: "我的生活极其不如意，以至于我只有通过上学、取得进步并做得更好以摆脱现实困境。" },
    { num: "④", en: "Later, her marriage ended and she became a single mother.", ref: "后来，她的婚姻结束，她成了单身母亲。" },
    { num: "⑤", en: "“It’s the hardest thing to take care of a teenager, have a job, pay the rent, pay the car payment, and pay the debt.", ref: "“照顾一个十来岁的孩子、工作、交房租、付车款、还要偿还债务，这是最辛苦的事情。" },
    { num: "⑥", en: "I lived from paycheck to paycheck.”", ref: "我过着勉强糊口的生活。" },
    { num: "⑦", en: "Not everyone experiences the kinds of severe chronic stresses Alvarez describes.", ref: "并不是每个人都承受着阿德琳·阿尔瓦雷兹描述的这种巨大的长期性压力。" },
    { num: "⑧", en: "But most women today are coping with a lot of obligations, with few breaks, and feeling the strain.", ref: "但如今大多数女性都担负着许多责任，几乎没有放松的时候，因此感到焦虑。" },
    { num: "⑨", en: "Alvarez’s experience demonstrates the importance of finding ways to diffuse stress before it threatens your health and your ability to function.", ref: "阿尔瓦需兹的经历说明在压力威胁到你的健康和身体机能之前寻求途径缓解压力是相当重要的。" }
    ]
  },
  {
    day: 57,
    type: "英一",
    source: "2008 Text 2",
    zh: "它曾是如此直接。在实验室通力合作的一组研究人员将他们的研究成果呈递给一份期刊。之后该期刊的某位编辑会隐去论文上作者的名字和所属机构，并送交同行专家评审。该编辑会根据收到的（专家）意见来决定是否同意发表该论文。论文的版权归属于期刊出版商，想要查询该研究成果相关信息的研究者不得不订阅该期刊。",
    sentences: [
    { num: "①", en: "It used to be so straightforward.", ref: "它曾是如此直接。" },
    { num: "②", en: "A team of researchers working together in the laboratory would submit the results of their research to a journal.", ref: "在实验室通力合作的一组研究人员将他们的研究成果呈递给一份期刊。" },
    { num: "③", en: "A journal editor would then remove the author’s names and affiliations from the paper and send it to their peers for review.", ref: "之后该期刊的某位编辑会隐去论文上作者的名字和所属机构，并送交同行专家评审。" },
    { num: "④", en: "Depending on the comments received, the editor would accept the paper for publication or decline it.", ref: "该编辑会根据收到的（专家）意见来决定是否同意发表该论文。" },
    { num: "⑤", en: "Copyright rested with the journal publisher, and researchers seeking knowledge of the results would have to subscribe to the journal.", ref: "论文的版权归属于期刊出版商，想要查询该研究成果相关信息的研究者不得不订阅该期刊。" }
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
    zh: "（情形）不再如此。因特网——以及来自资助机构的压力，这些机构质问，商业出版商为什么通过限制科研成果的获取从政府资助的研究项目中获利——正在使自由获取科研成果成为现实。经济合作与发展组织（OECD）刚刚发布了一份报告阐述了这一变化的深远影响。这篇由澳大利亚维多利亚大学的约翰·霍顿和 OECD 的格菜汉姆·维克利共同撰写的报告，让那些迄今为止赚取了丰厚利润的出版商读起来心情沉重。但其意义不止于此，它还标志着科学探索目前为止的一个关键要素发生的一种变化。",
    sentences: [
    { num: "①", en: "No longer.", ref: "（情形）不再如此。" },
    { num: "②", en: "The Internet—and pressure from funding agencies, who are questioning why commercial publishers are making money from government-funded research by restricting access to it—is making access to scientific results a reality.", ref: "因特网——以及来自资助机构的压力，这些机构质问，商业出版商为什么通过限制科研成果的获取从政府资助的研究项目中获利——正在使自由获取科研成果成为现实。" },
    { num: "③", en: "The Organization for Economic Co-operation and Development (OECD) has just issued a report describing the far-reaching consequences of this.", ref: "经济合作与发展组织（OECD）刚刚发布了一份报告阐述了这一变化的深远影响。" },
    { num: "④", en: "The report, by John Houghton of Victoria University in Australia and Graham Vickery of the OECD, makes heavy reading for publishers who have, so far, made handsome profits.", ref: "这篇由澳大利亚维多利亚大学的约翰·霍顿和 OECD 的格菜汉姆·维克利共同撰写的报告，让那些迄今为止赚取了丰厚利润的出版商读起来心情沉重。" },
    { num: "⑤", en: "But it goes further than that. It signals a change in what has, until now, been a key element of scientific endeavor.", ref: "但其意义不止于此，它还标志着科学探索目前为止的一个关键要素发生的一种变化。" }
    ]
  },
  {
    day: 59,
    type: "英一",
    source: "2008 Text 2",
    zh: "知识的价值以及科研公共投资的回报某种程度上取决于其广泛的传播和容易的获取。这是门大生意。在美国，核心科学出版市场的估值在 70 亿到 110 亿美元之间。国际科学、技术和医学出版商协会称，全球有超过 2000 家出版公司专门从事这些学科（科学、技术和医学）的出版，它们每年在近 16,000 种期刊中刊登超过 120 万篇论文。",
    sentences: [
    { num: "①", en: "The value of knowledge and the return on the public investment in research depends, in part, upon wide distribution and ready access.", ref: "知识的价值以及科研公共投资的回报某种程度上取决于其广泛的传播和容易的获取。" },
    { num: "②", en: "It is big business.", ref: "这是门大生意。" },
    { num: "③", en: "In America, the core scientific publishing market is estimated at between $7 billion and $11 billion.", ref: "在美国，核心科学出版市场的估值在 70 亿到 110 亿美元之间。" },
    { num: "④", en: "The International Association of Scientific, Technical and Medical Publishers says that there are more than 2,000 publishers worldwide specializing in these subjects. They publish more than 1.2 million articles each year in some 16,000 journals.", ref: "国际科学、技术和医学出版商协会称，全球有超过 2000 家出版公司专门从事这些学科（科学、技术和医学）的出版，它们每年在近 16,000 种期刊中刊登超过 120 万篇论文。" }
    ]
  },
  {
    day: 60,
    type: "英一",
    source: "2008 Text 2",
    zh: "这一情形如今正在改变。根据 OECD 的这份报告，目前已有约 75%的学术期刊上线。全新的商业模式正在涌现。报告作者明确指出了三种主要的模式。第一种是所谓的“大订单”模式，机构订户通过网站许可协议付费获取一大批网络期刊的（阅读）权限。第二种是开放存取出版，通常依靠作者（或其所属机构）支付论文出版费用。第三种是开放存取知识库，由大学或国际实验室这样的组织资助（建立）机构储存库。现有的其他模式是这三种的混合，如延期开放存取，即，期刊在（论文发表后的）前六个月只允许付费订调者阅读论文，之后免费提供给所有想阅读的人。所有这一切可能会改变传统的同行评议程序，至少对于论文出版是如此。",
    sentences: [
    { num: "①", en: "This is now changing.", ref: "这一情形如今正在改变。" },
    { num: "②", en: "According to the OECD report, some 75% of scholarly journals are now online.", ref: "根据 OECD 的这份报告，目前已有约 75%的学术期刊上线。" },
    { num: "③", en: "Entirely new business models are emerging;", ref: "全新的商业模式正在涌现。" },
    { num: "④", en: "three main ones were identified by the report’s authors.", ref: "报告作者明确指出了三种主要的模式。" },
    { num: "⑤", en: "There is the so-called big deal, where institutional subscribers pay for access to a collection of online journal titles through site-licensing agreements.", ref: "第一种是所谓的“大订单”模式，机构订户通过网站许可协议付费获取一大批网络期刊的（阅读）权限。" },
    { num: "⑥", en: "There is open-access publishing, typically supported by asking the author (or\u0003his employer) to pay for the paper to be published.", ref: "第二种是开放存取出版，通常依靠作者（或其所属机构）支付论文出版费用。" },
    { num: "⑦", en: "Finally, there are open-access archives, where organizations such as universities or international laboratories support institutional repositories.", ref: "第三种是开放存取知识库，由大学或国际实验室这样的组织资助（建立）机构储存库。" },
    { num: "⑧", en: "Other models exist that are hybrids of these three, such as delayed open-access, where journals allow only subscribers to read a paper for the first six months, before making it freely available to everyone who wishes to see it.", ref: "现有的其他模式是这三种的混合，如延期开放存取，即，期刊在（论文发表后的）前六个月只允许付费订调者阅读论文，之后免费提供给所有想阅读的人。" },
    { num: "⑨", en: "All this could change the traditional form of the peer-review process, at least for the publication of papers.", ref: "所有这一切可能会改变传统的同行评议程序，至少对于论文出版是如此。" }
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
    { num: "①", en: "In the early 1960s Wilt Chamberlain was one of the only three players in the National Basketball Association (NBA) listed at over seven feet.", ref: "20 世纪 60 年代初，威尔特·张伯伦是被列入全国篮球协会（NBA）超过七英尺的仅有三名球员之一。" },
    { num: "②", en: "If he had played last season, however, he would have been one of 42.", ref: "然而，假若上个赛季他还在打球的话，他就会是 42 名这样的球员中的一员了。" },
    { num: "③", en: "The bodies playing major professional sports have changed dramatically over the years, and managers have been more than willing to adjust team uniforms to fit the growing numbers of bigger, longer frames.", ref: "多年以来，从事主要职业运动的运动员身材发生了显著变化，经理们一直在欣然调整队服，以适合越来越多更大更高的身躯。" }
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
    zh: "然而，体育界的这种趋势可能正在掩盖一个未被注意到的事实：美国人的身高总体上已停止增长。尽管比 140 年前普遍高约两英寸，但现在的美国人——尤其是那些出生于已在美国生活好几代的家庭中的美国人——在 20 世纪 60 年代初就明显已达身高极限。他们不大可能再有任何身高增长了。莱特州立大学的人类学家威廉·卡梅隆·查姆利称:“就当今总人群而言，在现有的基因和环境水平下，我们的身高几乎已达极限。”至于 NBA 球员，他们身高的增长似乎是“从世界各地招募球员”这种日益普遍做法的结果。",
    sentences: [
    { num: "①", en: "The trend in sports, though, may be obscuring an unrecognized reality: Americans have generally stopped growing.", ref: "然而，体育界的这种趋势可能正在掩盖一个未被注意到的事实：美国人的身高总体上已停止增长。" },
    { num: "②", en: "Though typically about two inches taller now than 140 years ago, today’s people—especially those born to families who have lived in the U.S. for many generations—apparently reached their limit in the early 1960s.", ref: "尽管比 140 年前普遍高约两英寸，但现在的美国人——尤其是那些出生于已在美国生活好几代的家庭中的美国人——在 20 世纪 60 年代初就明显已达身高极限。" },
    { num: "③", en: "And they aren’t likely to get any taller.", ref: "他们不大可能再有任何身高增长了。" },
    { num: "④", en: "“In the general population today, at this genetic, environmental level, we’ve pretty much gone as far as we can go,” says anthropologist William Cameron Chumlea of Wright State University.", ref: "莱特州立大学的人类学家威廉·卡梅隆·查姆利称:“就当今总人群而言，在现有的基因和环境水平下，我们的身高几乎已达极限。" },
    { num: "⑤", en: "In the case of NBA players, their increase in height appears to result from the increasingly common practice of recruiting players from all over the world.", ref: "至于 NBA 球员，他们身高的增长似乎是“从世界各地招募球员”这种日益普遍做法的结果。" }
    ]
  },
  {
    day: 63,
    type: "英一",
    source: "2008 Text 3",
    zh: "身高增长需要热量和营养——尤其是蛋白质——以满足组织扩展的需求。人在 20 岁以后很少会继续长高了。20 世纪之初，营养不足和儿童传染病阻碍了身高的增长。然而，随着饮食和健康状况的改善，儿童和青少年的身高每 20 年平均增长约 1.5 英寸，这种模式被称为身高（增长）的长期趋势。然而根据疾病控制与预防中心的数据，平均身高——男性 5 英尺 9 英寸，女性 5 英尺 4 英寸——自 1960 年以来并未真正改变过。",
    sentences: [
    { num: "①", en: "Growth, which rarely continues beyond the age of 20, demands calories and nutrients—notably, protein—to feed expanding tissues.", ref: "身高增长需要热量和营养——尤其是蛋白质——以满足组织扩展的需求。人在 20 岁以后很少会继续长高了。" },
    { num: "②", en: "At the start of the 20th century, under-nutrition and childhood infections got in the way.", ref: "20 世纪之初，营养不足和儿童传染病阻碍了身高的增长。" },
    { num: "③", en: "But as diet and health improved, children and adolescents have, on average, increased in height by about an inch and a half every 20 years, a pattern known as the secular trend in height.", ref: "然而，随着饮食和健康状况的改善，儿童和青少年的身高每 20 年平均增长约 1.5 英寸，这种模式被称为身高（增长）的长期趋势。" },
    { num: "④", en: "Yet according to the Centers for Disease Control and Prevention, average height—5'9\" for men, 5'4\" for women—hasn’t really changed since 1960.", ref: "然而根据疾病控制与预防中心的数据，平均身高——男性 5 英尺 9 英寸，女性 5 英尺 4 英寸——自 1960 年以来并未真正改变过。" }
    ]
  },
  {
    day: 64,
    type: "英一",
    source: "2008 Text 3",
    zh: "从基因角度来讲，避免身材过高是有好处的。分娩过程中，较大的婴儿更难通过产道。此外，尽管人类已经直主行走了几百万年，但两足和背部仍继续同两足行走的姿势相抗衡，因而难以轻易承受过大过长的肢体反复施加的压力。西北大学人类学家威廉·伦纳德称:“对身高的一些真正限制是由个体有机体的基因结构所设定的”。",
    sentences: [
    { num: "①", en: "Genetically speaking, there are advantages to avoiding substantial height.", ref: "从基因角度来讲，避免身材过高是有好处的。" },
    { num: "②", en: "During childbirth, larger babies have more difficulty passing through the birth canal.", ref: "分娩过程中，较大的婴儿更难通过产道。" },
    { num: "③", en: "Moreover, even though humans have been upright for millions of years, our feet and back continue to struggle with bipedal posture and cannot easily withstand repeated strain imposed by oversize limbs.", ref: "此外，尽管人类已经直主行走了几百万年，但两足和背部仍继续同两足行走的姿势相抗衡，因而难以轻易承受过大过长的肢体反复施加的压力。" },
    { num: "④", en: "“There are some real constraints that are set by the genetic architecture of the individual organism,” says anthropologist William Leonard of Northwestern University.", ref: "西北大学人类学家威廉·伦纳德称:“对身高的一些真正限制是由个体有机体的基因结构所设定的”。" }
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
    zh: "基因最大值可能会改变，但别期望它根快就会发生。马萨诸塞州内蒂克陆军研究中心的资深人类学家克莱尔·戈登保证，90%的制服和工作台适合新兵，无需改动。她说，和篮球运动员的队服不同，军服尺寸一段时间以来从未改动。她还说，如果你需要预测在不久的将来人类的身高以设计一件装备，那基本上“你可以非常有把握地使用当前数据”",
    sentences: [
    { num: "①", en: "Genetic maximums can change, but don’t expect this to happen soon.", ref: "基因最大值可能会改变，但别期望它根快就会发生。" },
    { num: "②", en: "Claire C. Gordon, senior anthropologist at the Army Research Center in Natick, Mass. , ensures that 90 percent of the uniforms and workstations fit recruits without alteration.", ref: "马萨诸塞州内蒂克陆军研究中心的资深人类学家克莱尔·戈登保证，90%的制服和工作台适合新兵，无需改动。" },
    { num: "③", en: "She says that, unlike those for basketball, the length of military uniforms has not changed for some time.", ref: "她说，和篮球运动员的队服不同，军服尺寸一段时间以来从未改动。" },
    { num: "④", en: "And if you need to predict human height in the near future to design a piece of equipment, Gordon says that by and large, “you could use today’s data and feel fairly confident.”", ref: "她还说，如果你需要预测在不久的将来人类的身高以设计一件装备，那基本上“你可以非常有把握地使用当前数据。”" }
    ]
  },
  {
    day: 66,
    type: "英一",
    source: "2008 Text 4",
    zh: "1784 年，也就是在其成为美国总统的五年前，52 岁的乔治·华盛顿牙齿几乎掉光了。于是他雇用一名牙医移植了九颗牙齿到自己颌中——这些牙齿是从他的奴隶们口中拔出来的。这一形象与大多数人所记得的历史书中“砍樱桃树的乔治”大为不同。但最近，许多历史学家开始关注奴隶制在开国元勋们生活中所扮演的角色。他们在某种程度上是受到了 1998 年获得的 DNA 证据的鼓舞，该证据几乎可以确证托马斯·杰斐逊曾与其奴隶萨利·赫明斯育有至少一个孩子。只在最近三十年间学者们才开始全方位、彻底地研究历史。数位历史学家的著作揭示了美国早期领袖所做的道德妥协以及建国初期的脆弱性。更为重要的是，他们提出，许多开国元勋明知奴隶制是错误的——然而大部分人却极少有行动去抗争它。",
    sentences: [
    { num: "①", en: "In 1784, five years before he became president of the United States, George Washington, 52, was nearly toothless.", ref: "1784 年，也就是在其成为美国总统的五年前，52 岁的乔治·华盛顿牙齿几乎掉光了。" },
    { num: "②", en: "So he hired a dentist to transplant nine teeth into his jaw—having extracted them from the mouths of his slaves.", ref: "于是他雇用一名牙医移植了九颗牙齿到自己颌中——这些牙齿是从他的奴隶们口中拔出来的。" },
    { num: "③", en: "That’s a far different image from the cherry-tree-chopping George most people remember from their history books.", ref: "这一形象与大多数人所记得的历史书中“砍樱桃树的乔治”大为不同。" },
    { num: "④", en: "But recently, many historians have begun to focus on the role slavery played in the lives of the founding generation.", ref: "但最近，许多历史学家开始关注奴隶制在开国元勋们生活中所扮演的角色。" },
    { num: "⑤", en: "They have been spurred in part by DNA evidence made available in 1998, which almost certainly proved Thomas Jefferson had fathered at least one child with his slave Sally Hemings.", ref: "他们在某种程度上是受到了 1998 年获得的 DNA 证据的鼓舞，该证据几乎可以确证托马斯·杰斐逊曾与其奴隶萨利·赫明斯育有至少一个孩子。" },
    { num: "⑥", en: "And only over the past 30 years have scholars examined history from the bottom up.", ref: "只在最近三十年间学者们才开始全方位、彻底地研究历史。" },
    { num: "⑦", en: "Works of several historians reveal the moral compromises made by the nation’s early leaders and the fragile nature of the country’s infancy.", ref: "数位历史学家的著作揭示了美国早期领袖所做的道德妥协以及建国初期的脆弱性。" },
    { num: "⑧", en: "More significant, they argue that many of the Founding Fathers knew slavery was wrong—and yet most did little to fight it.", ref: "更为重要的是，他们提出，许多开国元勋明知奴隶制是错误的——然而大部分人却极少有行动去抗争它。" }
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
    zh: "最为重要的是，历史学家表示，开国元勋们受到了他们那个时代文化的束缚。尽管华盛顿和杰斐逊私下表达过对奴隶制的反感，但他们也明白奴隶制是他们帮助创建的这个国家的政治与经济基石的一部分。一方面，南方承担不起放弃奴隶的后果。拥有奴隶就“如同拥有大额银行存款”，《不完美的偶像：乔治·华盛顿，他的奴隶和美利坚的创立》一书的作者温瑟柯说道。如果没有对这种“特别制度”的保护条款，其中包括一项出于国会代表权的目的而将一名奴隶视为 3/5 个人的条款，南方各州当时便不会签署宪法。",
    sentences: [
    { num: "①", en: "More than anything, the historians say, the founders were hampered by the culture of their time.", ref: "最为重要的是，历史学家表示，开国元勋们受到了他们那个时代文化的束缚。" },
    { num: "②", en: "While Washington and Jefferson privately expressed distaste for slavery, they also understood that it was part of the political and economic bedrock of the country they helped to create.", ref: "尽管华盛顿和杰斐逊私下表达过对奴隶制的反感，但他们也明白奴隶制是他们帮助创建的这个国家的政治与经济基石的一部分。" },
    { num: "③", en: "For one thing, the South could not afford to part with its slaves.", ref: "一方面，南方承担不起放弃奴隶的后果。" },
    { num: "④", en: "Owning slaves was “like having a large bank account,” says Wiencek, author of An Imperfect God: George Washington, His Slaves, and the Creation of America.", ref: "拥有奴隶就“如同拥有大额银行存款”，《不完美的偶像：乔治·华盛顿，他的奴隶和美利坚的创立》一书的作者温瑟柯说道。" },
    { num: "⑤", en: "The southern states would not have signed the Constitution without protections for the “peculiar institution,” including a clause that counted a slave as three fifths of a man for purposes of congressional representation.", ref: "如果没有对这种“特别制度”的保护条款，其中包括一项出于国会代表权的目的而将一名奴隶视为 3/5 个人的条款，南方各州当时便不会签署宪法。" }
    ]
  },
  {
    day: 68,
    type: "英一",
    source: "2008 Text 4",
    zh: "并且这些政治家的政治生涯也取决于奴隶制。五分之三方案使选举人团中南方各州的选票数得以激增，使杰斐逊在 1800 年总统大选中得以险胜。杰斐逊一就职，便通过 1803 年的“路易斯安那购地案”扩大了奴隶制的范围，这片新土地被划分成 13 个州，包括三个蓄奴州。即便如此，但杰斐逊还是解放了赫明斯的孩子们——虽然没有解放她本人和其他大约 150名奴隶。在目睹了独立战争中黑人士兵的勇敢后，华盛顿开始相信人人生而平等，从而克服亲属的强烈反对，在遗嘱中给予了他的奴隶自由。就在十年前，这种行为在弗吉尼亚还要得到立法机构的批准。",
    sentences: [
    { num: "①", en: "And the statesmen’s political lives depended on slavery.", ref: "并且这些政治家的政治生涯也取决于奴隶制。" },
    { num: "②", en: "The three-fifths formula handed Jefferson his narrow victory in the presidential election of 1800 by inflating the votes of the southern states in the Electoral College.", ref: "五分之三方案使选举人团中南方各州的选票数得以激增，使杰斐逊在 1800 年总统大选中得以险胜。" },
    { num: "③", en: "Once in office, Jefferson extended slavery with the Louisiana Purchase in 1803; the new land was carved into 13 states, including three slave states.", ref: "杰斐逊一就职，便通过 1803 年的“路易斯安那购地案”扩大了奴隶制的范围，这片新土地被划分成 13 个州，包括三个蓄奴州。" },
    { num: "④", en: "Still, Jefferson freed Hemings’s children—though not Hemings herself or his approximately 150 other slaves.", ref: "即便如此，但杰斐逊还是解放了赫明斯的孩子们——虽然没有解放她本人和其他大约 150名奴隶。" },
    { num: "⑤", en: "Washington, who had begun to believe that all men were created equal after observing the bravery of the black soldiers during the Revolutionary War, overcame the strong opposition of his relatives to grant his slaves their freedom in his will.", ref: "在目睹了独立战争中黑人士兵的勇敢后，华盛顿开始相信人人生而平等，从而克服亲属的强烈反对，在遗嘱中给予了他的奴隶自由。" },
    { num: "⑥", en: "Only a decade earlier, such an act would have required legislative approval in Virginia.", ref: "就在十年前，这种行为在弗吉尼亚还要得到立法机构的批准。" }
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
    zh: "习惯是个奇特的东西。我们机械地按其行事：将大脑设定为自动驾驶模式，放松地进入熟悉的常规所带来的无意识舒适状态。威廉·华兹华斯在 19 世纪曾说过:“不是选择而是习惯支配着那些不善思考的人们。”在不断变化的 21 世纪，甚至“习惯”这个词本身都带有负面含义。因此，将习惯同创造力和创新在同一语境下讨论似乎矛盾。但脑研究人员发现，当我们有意识地培养新习惯时，我们会在大脑中生成相应的（神经）通路，甚至生成全新的脑细胞，（这些新的通路和脑细胞）能使我们的思路跳上新的、创新的轨道。",
    sentences: [
    { num: "①", en: "Habits are a funny thing.", ref: "习惯是个奇特的东西。" },
    { num: "②", en: "We reach for them mindlessly, setting our brains on auto-pilot and relaxing into the unconscious comfort of familiar routine.", ref: "我们机械地按其行事：将大脑设定为自动驾驶模式，放松地进入熟悉的常规所带来的无意识舒适状态。" },
    { num: "③", en: "“Not choice, but habit rules the unreflecting herd,” William Wordsworth said in the 19th century.", ref: "威廉·华兹华斯在 19 世纪曾说过:“不是选择而是习惯支配着那些不善思考的人们。" },
    { num: "④", en: "In the ever-changing 21st century, even the word “habit” carries a negative implication.", ref: "在不断变化的 21 世纪，甚至“习惯”这个词本身都带有负面含义。" },
    { num: "⑤", en: "So it seems paradoxical to talk about habits in the same context as creativity and innovation.", ref: "因此，将习惯同创造力和创新在同一语境下讨论似乎矛盾。" },
    { num: "⑥", en: "But brain researchers have discovered that when we consciously develop new habits, we create parallel paths, and even entirely new brain cells, that can jump our trains of thought onto new, innovative tracks.", ref: "但脑研究人员发现，当我们有意识地培养新习惯时，我们会在大脑中生成相应的（神经）通路，甚至生成全新的脑细胞，（这些新的通路和脑细胞）能使我们的思路跳上新的、创新的轨道。" }
    ]
  },
  {
    day: 70,
    type: "英一",
    source: "2009 Text 1",
    zh: "不要轻易将自己视为无法改变的凭习惯行事的生物，相反，我们可以通过有意识地培养新习惯来引导自己的改变。事实上，我们尝试的新事物越多——走出自身舒适区越多——我们就会变得越具有内在的创造力，无论是在职场上还是在私人生活中均是如此。",
    sentences: [
    { num: "①", en: "Rather than dismissing ourselves as unchangeable creatures of habit, we can instead direct our own change by consciously developing new habits.", ref: "不要轻易将自己视为无法改变的凭习惯行事的生物，相反，我们可以通过有意识地培养新习惯来引导自己的改变。" },
    { num: "②", en: "In fact, the more new things we try — the more we step outside our comfort zone — the more inherently creative we become, both in the workplace and in our personal lives.", ref: "事实上，我们尝试的新事物越多——走出自身舒适区越多——我们就会变得越具有内在的创造力，无论是在职场上还是在私人生活中均是如此。" }
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
    zh: "但是，不必费力试图根除旧习惯。旦那些常规做法的“辙痕”被印入大脑，则它们将长久存在。相反，我们刻意培养的新习惯会在大脑中生成相似的通路，它们可以绕开那些旧的线路。《开放的思维》一书作者道娜·马尔科娃说:“创新所需的首要条件是强烈的好奇心。但我们却被教导去‘做决定’，正如我们的总统称自己是‘决策者’一样”。她又补充道，然而，“做决定是只保留一种可能而将其他可能全部扼杀。（但是，）一个出色的创新型思考者却总在探寻着其他多种可能性。”",
    sentences: [
    { num: "①", en: "But don’t bother trying to kill off old habits;", ref: "但是，不必费力试图根除旧习惯。" },
    { num: "②", en: "once those ruts of procedure are worn into the brain, they’re there to stay.", ref: "旦那些常规做法的“辙痕”被印入大脑，则它们将长久存在。" },
    { num: "③", en: "Instead, the new habits we deliberately press into ourselves create parallel pathways that can bypass those old roads.", ref: "相反，我们刻意培养的新习惯会在大脑中生成相似的通路，它们可以绕开那些旧的线路。" },
    { num: "④", en: "“The first thing needed for innovation is a fascination with wonder,” says Dawna Markova, author of The Open Mind.", ref: "《开放的思维》一书作者道娜·马尔科娃说:“创新所需的首要条件是强烈的好奇心。" },
    { num: "⑤", en: "“But we are taught instead to ‘decide,’ just as our president calls himself ‘the Decider.’", ref: "但我们却被教导去‘做决定’，正如我们的总统称自己是‘决策者’一样”。" },
    { num: "⑥", en: "” She adds, however, that “to decide is to kill off all possibilities but one.", ref: "她又补充道，然而，“做决定是只保留一种可能而将其他可能全部扼杀。" },
    { num: "⑦", en: "A good innovational thinker is always exploring the many other possibilities.”", ref: "（但是，）一个出色的创新型思考者却总在探寻着其他多种可能性。”" }
    ]
  },
  {
    day: 72,
    type: "英一",
    source: "2009 Text 1",
    zh: "她说，我们都以我们意识不到的方式来解决问题。20 世纪 60 年代晚期的研究者们发现，人生来具有以四种基本方式应对挑战的能力：分析地、按流程地、联系地（或协作地）、创新地（应对挑战）。然而，在青春期结束时，大脑关闭了其中一半能力，只保留了那些在生命最初大约十年中似乎最有价值的思维方式。",
    sentences: [
    { num: "①", en: "All of us work through problems in ways of which we’re unaware, she says.", ref: "她说，我们都以我们意识不到的方式来解决问题。" },
    { num: "②", en: "Researchers in the late 1960s discovered that humans are born with the capacity to approach challenges in four primary ways: analytically, procedurally, relationally (or collaboratively) and innovatively.", ref: "20 世纪 60 年代晚期的研究者们发现，人生来具有以四种基本方式应对挑战的能力：分析地、按流程地、联系地（或协作地）、创新地（应对挑战）。" },
    { num: "③", en: "At the end of adolescence, however, the brain shuts down half of that capacity, preserving only those modes of thought that have seemed most valuable during the first decade or so of life.", ref: "然而，在青春期结束时，大脑关闭了其中一半能力，只保留了那些在生命最初大约十年中似乎最有价值的思维方式。" }
    ]
  },
  {
    day: 73,
    type: "英一",
    source: "2009 Text 1",
    zh: "当前对标准化测试的重视就是强调分析和流程，这意味着我们很少有人会本能地使用创新和协作的思维方式。“这打破了美国信仰体系中的主要准则——任何人可以做任何事，”2006年出版的《今年我打算……》一书的作者、马尔科娃女士的商业伙伴赖安说道。“这个准则是我们一直以来维系的一个谎言，它助长了平庸。了解你所擅长的并多加练习才能造就辉煌。”这正是培养新习惯的意义所在。",
    sentences: [
    { num: "①", en: "The current emphasis on standardized testing highlights analysis and procedure, meaning that few of us inherently use our innovative and collaborative modes of thought.", ref: "当前对标准化测试的重视就是强调分析和流程，这意味着我们很少有人会本能地使用创新和协作的思维方式。" },
    { num: "②", en: "“This breaks the major rule in the American belief system — that anyone can do anything,” explains M. J. Ryan, author of the 2006 book This Year I Will... and Ms. Markova’s business partner.", ref: "“这打破了美国信仰体系中的主要准则——任何人可以做任何事，”2006年出版的《今年我打算……》一书的作者、马尔科娃女士的商业伙伴赖安说道。" },
    { num: "③", en: "“That’s a lie that we have perpetuated, and it fosters commonness.", ref: "“这个准则是我们一直以来维系的一个谎言，它助长了平庸。" },
    { num: "④", en: "Knowing what you’re good at and doing even more of it creates excellence.”", ref: "了解你所擅长的并多加练习才能造就辉煌。" },
    { num: "⑤", en: "This is where developing new habits comes in.", ref: "这正是培养新习惯的意义所在。" }
    ]
  },
  {
    day: 74,
    type: "英一",
    source: "2009 Text 2",
    zh: "再睿智的父亲也未必能认出自己的孩子，但现在男性能够提升其为人父的智慧——或者说至少能确认自己就是孩子的父亲。他所需要做的仅仅是花 30 美元到邻近药店购买一份父子关系鉴定工具包（PTK），再花上 120 美元即可得到检测结果。自去年 PTK 无需医师处方即可购买以来，其购买者已逾 60,000 人，Identigene（一家生产这种非处方工具包的公司）首席运营官道格·福格说。直接向公众出售基因检测服务的公司超过 24 家，价格从几百美元到 2500 多美元不等。",
    sentences: [
    { num: "①", en: "It is a wise father that knows his own child, but today a man can boost his paternal (fatherly) wisdom—or at least confirm that he’s the kid’s dad.", ref: "再睿智的父亲也未必能认出自己的孩子，但现在男性能够提升其为人父的智慧——或者说至少能确认自己就是孩子的父亲。" },
    { num: "②", en: "All he needs to do is shell out $30 for paternity testing kit (PTK) at his local drugstore — and another $120 to get the results.", ref: "他所需要做的仅仅是花 30 美元到邻近药店购买一份父子关系鉴定工具包（PTK），再花上 120 美元即可得到检测结果。" },
    { num: "③", en: "More than 60,000 people have purchased the PTKs since they first become available without prescriptions last years, according to Doug Fogg, chief operating officer of Identigene, which makes the over-the-counter kits.", ref: "自去年 PTK 无需医师处方即可购买以来，其购买者已逾 60,000 人，Identigene（一家生产这种非处方工具包的公司）首席运营官道格·福格说。" },
    { num: "④", en: "More than two dozen companies sell DNA tests directly to the public, ranging in price from a few hundred dollars to more than $2500.", ref: "直接向公众出售基因检测服务的公司超过 24 家，价格从几百美元到 2500 多美元不等。" }
    ]
  },
  {
    day: 75,
    type: "英一",
    source: "2009 Text 2",
    zh: "基因检测中最受欢迎的有父子关系和亲属关系鉴定，被领养的孩子可利用它来找寻到血亲，家庭可利用它来追踪到给人领养的孩子。基因检测最近还在极富热情的系谱学家当中掀起一阵风——也为提供寻根问祖业务的企业提供支持。大多数检测都需要用棉签蘸取口中唾液采集细胞，并将唾液送到指定公司进行检测。所有的检测都需要一位潜在对照者，以便进行 DNA 比对。",
    sentences: [
    { num: "①", en: "Among the most popular: paternity and kinship testing, which adopted children can use to find their biological relatives and families can use to track down kids put up for adoption.", ref: "基因检测中最受欢迎的有父子关系和亲属关系鉴定，被领养的孩子可利用它来找寻到血亲，家庭可利用它来追踪到给人领养的孩子。" },
    { num: "②", en: "DNA testing is also the latest rage among passionate genealogists — and supports businesses that offer to search for a family’s geographic roots .", ref: "基因检测最近还在极富热情的系谱学家当中掀起一阵风——也为提供寻根问祖业务的企业提供支持。" },
    { num: "③", en: "Most tests require collecting cells by swabbing saliva in the mouth and sending it to the company for testing.", ref: "大多数检测都需要用棉签蘸取口中唾液采集细胞，并将唾液送到指定公司进行检测。" },
    { num: "④", en: "All tests require a potential candidate with whom to compare DNA.", ref: "所有的检测都需要一位潜在对照者，以便进行 DNA 比对。" }
    ]
  },
  {
    day: 76,
    type: "英一",
    source: "2009 Text 2",
    zh: "但一些观察家持怀疑态度。纽约大学社会学家特洛伊·达斯特说，“那些声称自己在做家谱检测的人所宣扬的是一种伪精确。”他指出，每个人都有许多位祖先——仅上溯几百年就数以百计。然而大部分家谱检测只考虑单一的谱系，或者是同一父系男性遗传的 Y 染色体，或者是仅通过母亲传递（给子女）的线粒体 DNA。这种 DNA 只能揭示一两位祖先的基因信息，尽管，譬如，仅上溯三代，每个人还有另外六位曾祖，上溯四代，还有另外十四位高祖。",
    sentences: [
    { num: "①", en: "But some observers are skeptical.", ref: "但一些观察家持怀疑态度。" },
    { num: "②", en: "“There is a kind of false precision being hawked by people claiming they are doing ancestry testing,” says Troy Duster, a New York University sociologist.", ref: "纽约大学社会学家特洛伊·达斯特说，“那些声称自己在做家谱检测的人所宣扬的是一种伪精确。" },
    { num: "③", en: "He notes that each individual has many ancestors — numbering in the hundreds just a few centuries back.", ref: "他指出，每个人都有许多位祖先——仅上溯几百年就数以百计。" },
    { num: "④", en: "Yet most ancestry testing only considers a single lineage, either the Y chromosome inherited through men in a father’s line or mitochondrial DNA, which is passed down only from mothers.", ref: "然而大部分家谱检测只考虑单一的谱系，或者是同一父系男性遗传的 Y 染色体，或者是仅通过母亲传递（给子女）的线粒体 DNA。" },
    { num: "⑤", en: "This DNA can reveal genetic information about only one or two ancestors, even though, for example, just three generations back people also have six other great-grandparents or, four generations back, 14 other great-great-grandparents.", ref: "这种 DNA 只能揭示一两位祖先的基因信息，尽管，譬如，仅上溯三代，每个人还有另外六位曾祖，上溯四代，还有另外十四位高祖。" }
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
    { num: "①", en: "Critics also argue that commercial genetic testing is only as good as the reference collections to which a sample is compared.", ref: "批评者还指出商业基因检测的好坏只取决于用于样本比对的参考数据库。" },
    { num: "②", en: "Databases used by some companies don’t rely on data collected systematically but rather lump together information from different research projects.", ref: "很多公司使用的数据库并未系统地收集数据，而是将不同研究项目的信息混杂合并一起。" },
    { num: "③", en: "This means that a DNA database may have a lot of data from some regions and not others, so a person’s test results may differ depending on the company that processes the results.", ref: "这意味着某个 DNA数据库可能有来自某些地区的大量数据，但缺乏其他地区的数据，因此同一个人的检测结果会随着处理研究结果的公司不同而存在差异。" },
    { num: "④", en: "In addition, the computer programs a company uses to estimate relationships may be patented and not subject to peer review or outside evaluation.", ref: "另外，公司用于判定亲属关系的计算机程序可能申请了专利，从而不接受同行评审或外界评估。" }
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
    { num: "①", en: "The relationship between formal education and economic growth in poor countries is widely misunderstood by economists and politicians alike.", ref: "经济学家和政治家都普遍误解了贫困国家中正规教育与经济增长之间的关系。" },
    { num: "②", en: "Progress in both areas is undoubtedly necessary for the social, political, and intellectual development of these and all other societies; however, the conventional view that education should be one of the very highest priorities for promoting rapid economic development in poor countries is wrong.", ref: "毫无疑问，这两个领域的进步对于这些国家以及其他所有国家的社会、政治及智力发展而言都必不可少；然而，“为促进贫困国家经济快速发展，应该把教育放在最优先考虑的位置”这一传统观点却是错的。" },
    { num: "③", en: "We are fortunate that it is, because building new educational systems there and putting enough people through them to improve economic performance would require two or three generations.", ref: "我们很庆幸这种观点是错的，因为在这些国家建立新的教育体制，随后让足够多的人接受教育以提振经济表现，将需要两三代人的努力。" },
    { num: "④", en: "The findings of a research institution have consistently shown that workers in all countries can be trained on the job to achieve radically higher productivity and, as a result, radically higher standards of living.", ref: "某研究机构的多项研究结果一致表明，所有国家的工人生产力都可以通过在职培训从根本上得到提高，由此从根本上提高生活水平。" }
    ]
  },
  {
    day: 79,
    type: "英一",
    source: "2009 Text 3",
    zh: "具有讽刺意味的是，这一观点最先在美国得到印证。不久前，随着美国经济进入衰退期而日本经济处于泡沫破灭前的顶峰，美国劳动大军被嘲调受教育水平低，（这一点）被看作是其经济表现不振的主要原因之一。从过去到现在，日本在汽车装配生产力方面一直都保持全球领先地位。然而研究表明，本田、日产、丰田（三家日本汽车商）在美国的工厂达到了日本本土工厂生产力的约 95%，这归功于美国工人接受的在职培训。",
    sentences: [
    { num: "①", en: "Ironically, the first evidence for this idea appeared in the United States.", ref: "具有讽刺意味的是，这一观点最先在美国得到印证。" },
    { num: "②", en: "Not long ago, with the country entering a recession and Japan at its pre-bubble peak, the U.S. workforce was derided as poorly educated and one of primary causes of the poor U.S. economic performance.", ref: "不久前，随着美国经济进入衰退期而日本经济处于泡沫破灭前的顶峰，美国劳动大军被嘲调受教育水平低，（这一点）被看作是其经济表现不振的主要原因之一。" },
    { num: "③", en: "Japan was, and remains, the global leader in automotive-assembly productivity.", ref: "从过去到现在，日本在汽车装配生产力方面一直都保持全球领先地位。" },
    { num: "④", en: "Yet the research revealed that the U.S. factories of Honda, Nissan, and Toyota achieved about 95 percent of the productivity of their Japanese counterparts — a result of the training that U.S. workers received on the job.", ref: "然而研究表明，本田、日产、丰田（三家日本汽车商）在美国的工厂达到了日本本土工厂生产力的约 95%，这归功于美国工人接受的在职培训。" }
    ]
  },
  {
    day: 80,
    type: "英一",
    source: "2009 Text 3",
    zh: "更近些时候，研究者在调查住宅建设时发现，尽管建筑业的工作很复杂，但是德克萨斯州体斯敦市那些不识字、不会说英语的墨西哥工人却始终能达到劳动生产力的最佳实践标准。",
    sentences: [
    { num: "①", en: "More recently, while examining housing construction, the researchers discovered that illiterate, non-English-speaking Mexican workers in Houston, Texas, consistently met best-practice labor productivity standards despite the complexity of the building industry’s work.", ref: "更近些时候，研究者在调查住宅建设时发现，尽管建筑业的工作很复杂，但是德克萨斯州体斯敦市那些不识字、不会说英语的墨西哥工人却始终能达到劳动生产力的最佳实践标准。" }
    ]
  },
  {
    day: 81,
    type: "英一",
    source: "2009 Text 3",
    zh: "（那么）教育与经济发展之间的真正关联是什么？我们不得不猜想即使政府不强制推行教育，经济持续增长也会促进教育发展。毕竟，教育最初就是这样产生的。一万年前，当我们的祖先依靠狩猎、采集为生的时候，他们根本没有琢磨除觅食外其他事情的时间。只有当人类开始更有效率地获取食物之后，他们才有考虑其他事情的时间。",
    sentences: [
    { num: "①", en: "What is the real relationship between education and economic development?", ref: "（那么）教育与经济发展之间的真正关联是什么？" },
    { num: "②", en: "We have to suspect that continuing economic growth promotes the development of education even when governments don’t force it.", ref: "我们不得不猜想即使政府不强制推行教育，经济持续增长也会促进教育发展。" },
    { num: "③", en: "After all, that’s how education got started.", ref: "毕竟，教育最初就是这样产生的。" },
    { num: "④", en: "When our ancestors were hunters and gatherers 10,000 years ago, they didn’t have time to wonder much about anything besides finding food.", ref: "一万年前，当我们的祖先依靠狩猎、采集为生的时候，他们根本没有琢磨除觅食外其他事情的时间。" },
    { num: "⑤", en: "Only when humanity began to get its food in a more productive way was there time for other things.", ref: "只有当人类开始更有效率地获取食物之后，他们才有考虑其他事情的时间。" }
    ]
  },
  {
    day: 82,
    type: "英一",
    source: "2009 Text 3",
    zh: "随着教育的改善，人类生产力潜能也得到了提高。当竞争环境迫使我们的祖先去获得这种潜能时，他们反过来又能受得起更多教育。对出色经济表现所要求的复杂政治体制来说，这种日益提高的教育水平可能是一个必要但不充分条件。因此，如果不进行“只能靠更广泛正规教育才有可能实现”的政治变革，贫困国家可能无法摆脱其贫困牢笼。但是，正规教育的缺乏并不会限制发展中国家劳动人口在可预见的未来从本质上提高生产力；相反，对生产力提高的限制解释了为什么这些国家的教育没能发展得更快。",
    sentences: [
    { num: "①", en: "As education improved, humanity’s productivity potential increased as well.", ref: "随着教育的改善，人类生产力潜能也得到了提高。" },
    { num: "②", en: "When the competitive environment pushed our ancestors to achieve that potential, they could in turn afford more education.", ref: "当竞争环境迫使我们的祖先去获得这种潜能时，他们反过来又能受得起更多教育。" },
    { num: "③", en: "This increasingly high level of education is probably a necessary, but not a sufficient, condition for the complex political systems required by advanced economic performance.", ref: "对出色经济表现所要求的复杂政治体制来说，这种日益提高的教育水平可能是一个必要但不充分条件。" },
    { num: "④", en: "Thus poor countries might not be able to escape their poverty traps without political changes that may be possible only with broader formal education.", ref: "因此，如果不进行“只能靠更广泛正规教育才有可能实现”的政治变革，贫困国家可能无法摆脱其贫困牢笼。" },
    { num: "⑤", en: "A lack of formal education, however, doesn’t constrain the ability of the developing world’s workforce to substantially improve productivity for the foreseeable future.", ref: "但是，正规教育的缺乏并不会限制发展中国家劳动人口在可预见的未来从本质上提高生产力。" },
    { num: "⑥", en: "On the contrary, constraints on improving productivity explain why education isn’t developing more quickly there than it is.", ref: "相反，对生产力提高的限制解释了为什么这些国家的教育没能发展得更快。" }
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
    { num: "①", en: "The most thoroughly studied intellectuals in the history of the new world are the ministers and political leaders of seventeenth-century New England.", ref: "（美洲）新大陆历史中被研究得最为彻底的知识分子是 17 世纪新英格兰的牧师和政治领袖。" },
    { num: "②", en: "According to the standard history of American philosophy, nowhere else in colonial America was “so much importance attached to intellectual pursuits.”", ref: "根据权威的美国哲学史记载，在殖民地时期的美洲，没有其他地区“如此注重文化爱好”。" },
    { num: "③", en: "According to many books and articles, New England’s leaders established the basic themes and preoccupations of an unfolding, dominant Puritan tradition in American intellectual life.", ref: "根据许多书籍和文献记载，新英格兰领导者确立了美国文化生活中逐渐发展并占据主流地位的清教传统的基本主题和关注重点。" }
    ]
  },
  {
    day: 84,
    type: "英一",
    source: "2009 Text 4",
    zh: "以这种方法研究新英格兰人通常意味着从清教徒的神学新观念及其对教会的独特看法入手——这些都是我们不可忽略的重要主题。但是为了与我们对美国南部地区文化生活的考察保持一致，我们可以将这些最初的清教徒视为欧洲文化的承载者，他们在适应新大陆的环境。在追求文明礼仪和精湛技艺这些被广泛认可的理想的过程中，新英格兰殖民地曾是重大事件的发生地。",
    sentences: [
    { num: "①", en: "To take this approach to the New Englanders normally means to start with the Puritans’ theological innovations and their distinctive ideas about the church—important subjects that we may not neglect.", ref: "以这种方法研究新英格兰人通常意味着从清教徒的神学新观念及其对教会的独特看法入手——这些都是我们不可忽略的重要主题。" },
    { num: "②", en: "But in keeping with our examination of southern intellectual life, we may consider the original Puritans as carriers of European culture, adjusting to New World circumstances.", ref: "但是为了与我们对美国南部地区文化生活的考察保持一致，我们可以将这些最初的清教徒视为欧洲文化的承载者，他们在适应新大陆的环境。" },
    { num: "③", en: "The New England colonies were the scenes of important episodes in the pursuit of widely understood ideals of civility and virtuosity.", ref: "在追求文明礼仪和精湛技艺这些被广泛认可的理想的过程中，新英格兰殖民地曾是重大事件的发生地。" }
    ]
  },
  {
    day: 85,
    type: "英一",
    source: "2009 Text 4",
    zh: "马萨诸塞湾的早期移民包括在英格兰受过良好教育并具有相当影响力的人。除了 1629 年后十年中来到马萨诸塞教会的约 90 位博学牧师之外，还有像约翰·温思罗普这样的政治领袖，他是一位受过良好教育的绅士、律师，远航到波士顿之前曾担任王室官员。这些人大规模著书并出版，为新大陆、旧大陆读者所熟悉，为新英格兰营造了一种热切求知的氛围。",
    sentences: [
    { num: "①", en: "The early settlers of Massachusetts Bay included men of impressive education and influence in England.", ref: "马萨诸塞湾的早期移民包括在英格兰受过良好教育并具有相当影响力的人。" },
    { num: "②", en: "Besides the ninety or so learned ministers who came to Massachusetts churches in the decade after 1629, there were political leaders like John Winthrop, an educated gentleman, lawyer, and official of the Crown before he journeyed to Boston.", ref: "除了 1629 年后十年中来到马萨诸塞教会的约 90 位博学牧师之外，还有像约翰·温思罗普这样的政治领袖，他是一位受过良好教育的绅士、律师，远航到波士顿之前曾担任王室官员。" },
    { num: "③", en: "These men wrote and published extensively, reaching both New World and Old World audiences, and giving New England an atmosphere of intellectual earnestness.", ref: "这些人大规模著书并出版，为新大陆、旧大陆读者所熟悉，为新英格兰营造了一种热切求知的氛围。" }
    ]
  },
  {
    day: 86,
    type: "英一",
    source: "2009 Text 4",
    zh: "然而，我们不该忘记，大多数新英格兰人并未受过良好教育。尽管很少有手工艺者和农民——更不用说侍从和仆人——留下可供分析的书面作品，但他们的观点显然不那么足够理智。他们的思维往往带有传统的迷信色彩。一位名叫约翰·丹奈的裁缝，于 17 世纪 30 年代后期移居新大陆，他所留下的关于离开英格兰原因的叙述里充满了神迹。性的困惑、经济挫折和宗教期望——所有这些都在某一关键性时刻一齐涌来，他打开《圣经》，告诉父亲他读到的第一行字将决定他的命运，接着便读到了以下神奇的语句:“从他们中走出来吧，不要沾染不洁之物，我愿成为你的上帝，你就是我的子民。”人们会纳闷，丹奈在清教教会里听那些精心诠释的布道文时作何感想。另一方面，很多移民并没有丹奈这么虔诚的宗教信仰，正如某一牧师在与沿海居民打交道时所意识到的那样。那些人嘲弄地说来新大陆并非为了宗教，“我们的主要目的是捕鱼。”",
    sentences: [
    { num: "①", en: "We should not forget, however, that most New Englanders were less well educated.", ref: "然而，我们不该忘记，大多数新英格兰人并未受过良好教育。" },
    { num: "②", en: "While few crafts men or farmers, let alone dependents and servants, left literary compositions to be analyzed, it is obvious that their views were less fully intellectualized.", ref: "尽管很少有手工艺者和农民——更不用说侍从和仆人——留下可供分析的书面作品，但他们的观点显然不那么足够理智。" },
    { num: "③", en: "Their thinking often had a traditional superstitious quality.", ref: "他们的思维往往带有传统的迷信色彩。" },
    { num: "④", en: "A tailor named John Dane, who emigrated in the late 1630s, left an account of his reasons for leaving England that is filled with signs.", ref: "一位名叫约翰·丹奈的裁缝，于 17 世纪 30 年代后期移居新大陆，他所留下的关于离开英格兰原因的叙述里充满了神迹。" },
    { num: "⑤", en: "Sexual confusion, economic frustrations, and religious hope — all came together in a decisive moment when he opened the Bible, told his father that the first line he saw would settle his fate, and read the magical words: “Come out from among them, touch no unclean thing, and I will be your God and you shall be my people.”", ref: "性的困惑、经济挫折和宗教期望——所有这些都在某一关键性时刻一齐涌来，他打开《圣经》，告诉父亲他读到的第一行字将决定他的命运，接着便读到了以下神奇的语句:“从他们中走出来吧，不要沾染不洁之物，我愿成为你的上帝，你就是我的子民。" },
    { num: "⑥", en: "One wonders what Dane thought of the careful sermons explaining the Bible that he heard in Puritan churches.", ref: "人们会纳闷，丹奈在清教教会里听那些精心诠释的布道文时作何感想。" },
    { num: "⑦", en: "Meanwhile, many settlers had slighter religious commitments than Dane’s, as one clergyman learned in confronting folk along the coast who mocked that they had not come to the New World for religion.", ref: "另一方面，很多移民并没有丹奈这么虔诚的宗教信仰，正如某一牧师在与沿海居民打交道时所意识到的那样。" },
    { num: "⑧", en: "“Our main end was to catch fish.”", ref: "那些人嘲弄地说来新大陆并非为了宗教，“我们的主要目的是捕鱼。”" }
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
    { num: "①", en: "Of all the changes that have taken place in English-language newspapers during the past quarter-century, perhaps the most far-reaching has been the inexorable decline in the scope and seriousness of their arts coverage.", ref: "英文报纸过去 25 年间发生的所有变化中，影响最为深远的或许就是其艺术报道范围和严肃性已呈不可遏止的衰落之势。" },
    { num: "②", en: "It is difficult to the point of impossibility for the average reader under the age of forty to imagine a time when high-quality arts criticism could be found in most big-city newspapers.", ref: "对于 40 岁以下的普通读者而言，他们难以，甚至根本无法想象一个能在大多数大都市报纸上读到高质量艺术评论的时代。" },
    { num: "③", en: "Yet a considerable number of the most significant collections of criticism published in the 20th century consisted in large part of newspaper reviews.", ref: "然而 20 世纪出版的相当多的最具重要影响的评论文集大部分由报纸评论组成。" },
    { num: "④", en: "To read such books today is to marvel at the fact that their learned contents were once deemed suitable for publication in general-circulation dailies.", ref: "若今日再来阅读这些文集，会惊叹于这样一个事实：里面这些广博精深的内容曾被认为适合刊登在面向大众发行的日报上。" }
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
    zh: "我们与 20 世纪初至二战前夕英国的杂感式报纸评论就更是无缘了，当时，新闻用纸价廉如土，风格独特的艺术评论被看作是对刊登它的出版物的一种装饰在那个遥远的年代，各大报纸的评论家们会对所报道的事件撰写详尽入微的评论这被视作理所当然。他们从事的是严肃的工作，人们信任，即便是那些以轻松活泼的方式展现自己学问的评论家，如萧伯纳和欧内斯特·纽曼，也都清楚自己在做什么。这些人相信新闻写作是他们的天职，并为自己的文章能发表在日报上而感到自豪。“能够拥有足够的智慧或文学天赋能尽职尽责做好新闻写作工作本分的作家是如此之少”，纽曼写道，“以至于我不禁想把‘新闻写作’定义成为‘没读者的作家对有读者作家的蔑称’”。",
    sentences: [
    { num: "①", en: "We are even farther removed from the unfocused newspaper reviews published in England between the turn of the 20th century and the eve of World War II, at a time when newsprint was dirt-cheap and stylish arts criticism was considered an ornament to the publications in which it appeared.", ref: "我们与 20 世纪初至二战前夕英国的杂感式报纸评论就更是无缘了，当时，新闻用纸价廉如土，风格独特的艺术评论被看作是对刊登它的出版物的一种装饰。" },
    { num: "②", en: "In those far-off days, it was taken for granted that the critics of major papers would write in detail and at length about the events they covered.", ref: "在那个遥远的年代，各大报纸的评论家们会对所报道的事件撰写详尽入微的评论这被视作理所当然。" },
    { num: "③", en: "Theirs was a serious business, and even those reviewers who wore their learning lightly, like George Bernard Shaw and Ernest Newman, could be trusted to know what they were about.", ref: "他们从事的是严肃的工作，人们信任，即便是那些以轻松活泼的方式展现自己学问的评论家，如萧伯纳和欧内斯特·纽曼，也都清楚自己在做什么。" },
    { num: "④", en: "These men believed in journalism as a calling, and were proud to be published in the daily press.", ref: "这些人相信新闻写作是他们的天职，并为自己的文章能发表在日报上而感到自豪。" },
    { num: "⑤", en: "“So few authors have brains enough or literary gift enough to keep their own end up in journalism,” Newman wrote, “that I am tempted to define ‘journalism’ as ‘a term of contempt applied by writers who are not read to writers who are’.”", ref: "“能够拥有足够的智慧或文学天赋能尽职尽责做好新闻写作工作本分的作家是如此之少”，纽曼写道，“以至于我不禁想把‘新闻写作’定义成为‘没读者的作家对有读者作家的蔑称’”。" }
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
    zh: "遗憾的是，这些评论家几乎被完全遗忘了，内维尔·卡达斯从 1917 年到 1975 年去世前不久，一直在为《曼彻斯特卫报》撰写评论文章，可现在仅以板球比赛短评撰写人为人所知。但是，在他的一生之中，他也是英国最优秀的古典音乐评论家之一，他同时还是一位文体家，如此之广受赞誉，以致于其《自传》（1947 年出版）成为一本畅销书。1967 年，他受封为爵士，是第一位享有如此殊荣的音乐评论家。然而现如今，他的著作中只有一本仍在印行，他大量的乐评作品除了专业人士之外，无人知晓。卡达斯的评论还有再度盛行的可能吗？前景似乎非常渺茫。早在他去世前的很长一段时间，新闻业的品味就已经改变。后现代的读者们几乎不再喜欢他所专长的极其华丽的维多利亚-爱德华时期风格的散文。更何况，音乐评论的业余传统已经迅速走向衰落。",
    sentences: [
    { num: "①", en: "Unfortunately, these critics are virtually forgotten.", ref: "遗憾的是，这些评论家几乎被完全遗忘了，内维尔·卡达斯从 1917 年到 1975 年去世前不久，一直在为《曼彻斯特卫报》撰写评论文章，可现在仅以板球比赛短评撰写人为人所知。" },
    { num: "②", en: "Neville Cardus, who wrote for the Manchester Guardian from 1917 until shortly before his death in 1975, is now known solely as a writer of essays on the game of cricket.", ref: "但是，在他的一生之中，他也是英国最优秀的古典音乐评论家之一，他同时还是一位文体家，如此之广受赞誉，以致于其《自传》（1947 年出版）成为一本畅销书。" },
    { num: "③", en: "During his lifetime, though, he was also one of England’s foremost classical-music critics, and a stylist so widely admired that his Autobiography (1947) became a best-seller.", ref: "1967 年，他受封为爵士，是第一位享有如此殊荣的音乐评论家。" },
    { num: "④", en: "He was knighted in 1967, the first music critic to be so honored.", ref: "然而现如今，他的著作中只有一本仍在印行，他大量的乐评作品除了专业人士之外，无人知晓。" },
    { num: "⑤", en: "Yet only one of his books is now in print, and his vast body of writings on music is unknown save to specialists.", ref: "卡达斯的评论还有再度盛行的可能吗？" },
    { num: "⑥", en: "Is there any chance that Cardus’s criticism will enjoy a revival?", ref: "前景似乎非常渺茫。" },
    { num: "⑦", en: "The prospect seems remote.", ref: "早在他去世前的很长一段时间，新闻业的品味就已经改变。" },
    { num: "⑧", en: "Journalistic tastes had changed long before his death, and postmodern readers have little use for the richly upholstered Vicwardian prose in which he specialized.", ref: "后现代的读者们几乎不再喜欢他所专长的极其华丽的维多利亚-爱德华时期风格的散文。" },
    { num: "⑨", en: "Moreover, the amateur tradition in music criticism has been in headlong retreat.", ref: "更何况，音乐评论的业余传统已经迅速走向衰落。" }
    ]
  },
  {
    day: 90,
    type: "英一",
    source: "2010 Text 2",
    zh: "过去十年间，成千上万项专利被授给了所谓的“商业方法”。亚马逊公司因其“一键式”在线支付系统获得了一项专利。美林集团因其某种资产配置策略获得了法律保护。某发明者取得了一种提箱技术的专利。现在国家最高专利法庭似乎完全准备好缩减商业方法专利的数量，这类专利自十年前首次获批以来就一直备受争议。在一次令知识产权律师们议论纷纷的举措中，美国联邦巡回上诉法院宣称，它将利用一起特殊案件对商业方法专利开展广泛复审。这个被熟知为比尔斯基案的案件“事关重大”，密苏里大学法学院的丹尼斯·D·克劳奇说，它“有撤销一整类专利的潜力”。",
    sentences: [
    { num: "①", en: "Over the past decade, thousands of patents have been granted for what are called business methods.", ref: "过去十年间，成千上万项专利被授给了所谓的“商业方法”。" },
    { num: "②", en: "Amazon.com received one for its “one-click” online payment system.", ref: "亚马逊公司因其“一键式”在线支付系统获得了一项专利。" },
    { num: "③", en: "Merrill Lynch got legal protection for an asset allocation strategy.", ref: "美林集团因其某种资产配置策略获得了法律保护。" },
    { num: "④", en: "One inventor patented a technique for lifting a box.", ref: "某发明者取得了一种提箱技术的专利。" },
    { num: "⑤", en: "Now the nation’s top patent court appears completely ready to scale back on business-method patents, which have been controversial ever since they were first authorized 10 years ago.", ref: "现在国家最高专利法庭似乎完全准备好缩减商业方法专利的数量，这类专利自十年前首次获批以来就一直备受争议。" },
    { num: "⑥", en: "In a move that has intellectual-property lawyers abuzz, the U.S. Court of Appeals for the Federal Circuit said it would use a particular case to conduct a broad review of business-method patents.", ref: "在一次令知识产权律师们议论纷纷的举措中，美国联邦巡回上诉法院宣称，它将利用一起特殊案件对商业方法专利开展广泛复审。" },
    { num: "⑦", en: "In re Bilski, as the case is known, is “a very big deal”, says Dennis D. Crouch of the University of Missouri School of law. It “has the potential to eliminate an entire class of patents”.", ref: "这个被熟知为比尔斯基案的案件“事关重大”，密苏里大学法学院的丹尼斯·D·克劳奇说，它“有撤销一整类专利的潜力”。" }
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
    { num: "①", en: "Curbs on business-method claims would be a dramatic about-face, because it was the Federal Circuit itself that introduced such patents with its 1998 decision in the so-called State Street Bank case, approving a patent on a way of pooling mutual-fund assets.", ref: "对商业方法专利申请的限制也许是一次戏剧性的 180 度逆转，因为正是联邦巡回法院自己在1998 年被称为“道富银行案”的裁决中引入了此类专利，批准了一项共同基金资产筹集方法的专利。" },
    { num: "②", en: "That ruling produced an explosion in business-method patent filings, initially by emerging Internet companies trying to stake out exclusive rights to specific types of online transactions.", ref: "那项裁决导致了商业方法专利申请卷宗的激增，起初是新兴网络公司试图对特定类型的在线交易占得专有权。" },
    { num: "③", en: "Later, more established companies raced to add such patents to their files, if only as a defensive move against rivals that might beat them to the punch.", ref: "后来，更多的老牌公司竞相将此类专利归入其卷宗，哪怕只是作为一项防御性措施以防范可能先发制人的竞争对手。" },
    { num: "④", en: "In 2005, IBM noted in a court filing that it had been issued more than 300 business-method patents, despite the fact that it questioned the legal basis for granting them.", ref: "2005 年，IBM 在一份法院案卷中注意到自己被授予了 300 多项商业方法专利，尽管它质疑授予这些专利的法律依据。" },
    { num: "⑤", en: "Similarly, some Wall Street investment firms armed themselves with patents for financial products, even as they took positions in court cases opposing the practice.", ref: "无独有偶，一些华尔街投资公司也都以金融产品专利来武装自己，即使它们在法庭案例中表示反对这一做法。" }
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
    { num: "①", en: "The Bilski case involves a claimed patent on a method for hedging risk in the energy market.", ref: "比尔斯基案涉及一项规避能源市场风险方法的专利申请。" },
    { num: "②", en: "The Federal circuit issued an unusual order stating that the case would be heard by all 12 of the court’s judges, rather than a typical panel of three, and that one issue it wants to evaluate is whether it should “reconsider” its State Street Bank ruling.", ref: "联邦巡回法院发布了一项不同寻常的指令，宣称此案将由该法院全体 12 名法官听审，而不是典型的三人组听审，并且宣称法院想要评估一个问题，即，是否需要“重新审议”对道富银行案的裁决。" }
    ]
  },
  {
    day: 93,
    type: "英一",
    source: "2010 Text 2",
    zh: "联邦巡回法院的（上述）行动紧随最高法院近期一连串缩小专利持有人受保护范围的决议之后。比如，去年 4 月，法官们表示太多的专利授给了平淡无奇的“发明”联邦巡回法院的法官们正在“对最高法院的反专利趋势作出反应”，身兼专利律师和乔治华盛顿大学法学院教授的哈拉尔德·C·韦格纳说。",
    sentences: [
    { num: "①", en: "The Federal Circuit’s action comes in the wake of a series of recent decisions by the Supreme Court that has narrowed the scope of protections for patent holders.", ref: "联邦巡回法院的（上述）行动紧随最高法院近期一连串缩小专利持有人受保护范围的决议之后。" },
    { num: "②", en: "Last April, for example, the justices signaled that too many patents were being upheld for “inventions” that are obvious.", ref: "比如，去年 4 月，法官们表示太多的专利授给了平淡无奇的“发明”。" },
    { num: "③", en: "The judges on the Federal Circuit are “reacting to the anti-patent trend at the Supreme Court”, says Harold C. Wegner, a patent attorney and professor at George Washington University Law School.", ref: "联邦巡回法院的法官们正在“对最高法院的反专利趋势作出反应”，身兼专利律师和乔治华盛顿大学法学院教授的哈拉尔德·C·韦格纳说。" }
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
    { num: "①", en: "In his book The Tipping Point, Malcolm Gladwell argues that “social epidemics” are driven in large part by the actions of a tiny minority of special individuals, often called influentials, who are unusually informed, persuasive, or well connected.", ref: "马尔科姆·格拉德威尔在其《引爆点》一书中提出，“社会流行潮”在很大程度上由极少数与众不同的个人的行为所推动，这些人通常被称为“有影响力人士”，他们或见识非常广博、或很有说服力，或人脉极广。" },
    { num: "②", en: "The idea is intuitively compelling, but it doesn’t explain how ideas actually spread.", ref: "这一观点虽直觉上令人信服，但未能解释观念实际上如何传播。" },
    { num: "③", en: "The supposed importance of influentials derives from a plausible-sounding but largely untested theory called the “two-step flow of communication” : Information flows from the media to the influentials and from them to everyone else.", ref: "有影响力人士的所谓重要性源于一个貌似合理、但很大程度上未经证实的被称作“两级流动传播”的理论：信息从媒体流向有影响力人士，再从他们流向其他所有人。" },
    { num: "④", en: "Marketers have embraced the two-step flow because it suggests that if they can just find and influence the influentials, those select people will do most of the work for them.", ref: "营销人员已经欣然接受这种两级流动，因为该理论认为，他们只要能够找到有影响力人士并对其施加影响，这些精挑细选出来的人们就可以为他们完成大部分工作。" },
    { num: "⑤", en: "The theory also seems to explain the sudden and unexpected popularity of certain looks, brands, or neighborhoods.", ref: "该理论似乎也解释了某些时式、品牌或地段突然出人意料地大受欢迎的原因。" },
    { num: "⑥", en: "In many such cases, a cursory search for causes finds that some small group of people was wearing, promoting, or developing whatever it is before anyone else paid attention.", ref: "在诸多此类情形中，粗略调查其原因会发现，的确有一小部分人在其他所有人留意之前，就率先穿戴、推广或开发各类东西。" },
    { num: "⑦", en: "Anecdotal evidence of this kind fits nicely with the idea that only certain special people can drive trends.", ref: "这种轶事证据与“只有某些特别的人才能推动潮流”的观点高度契合。" }
    ]
  },
  {
    day: 95,
    type: "英一",
    source: "2010 Text 3",
    zh: "然而，一些研究人员在近期研究中得出结论有影响力人士对社会流行潮的影响远比人们通常认为的要小得多。事实上，他们似乎根本不是（社会流行潮）所必需的。研究人员的观点基于对社会影响的一项简单观察：除了像奥普拉·温弗瑞这样的个别名人——她的非凡影响力主要是媒体影响而非人际影响的作用——即使是一个群体中最具影响力的人也根本不会与那么多的人交往。而根据两级流动理论，恰恰是这些非名人有影响力人士通过直接影响他们的朋友和同事，推动了社会流行潮。但是，一种社会流行潮要形成，每个这样受到有影响力人士影响的人都必须接着影响自己的熟人，这些熟人又必须同样地影响他们的熟人，并依次影响下去；这些人中的每个人能得到多少人关注与最初的有影响力人士并无多大关系。例如，假若此“人际影响网络”中与最初有影响力人士仅相隔两个层级的人们表现出（对这种影响的）无动于衷，那么变化的“瀑布流”就不会传播得太远，或者影响很多人。",
    sentences: [
    { num: "①", en: "In their recent work, however, some researchers have come up with the finding that influentials have far less impact on social epidemics than is generally supposed.", ref: "然而，一些研究人员在近期研究中得出结论有影响力人士对社会流行潮的影响远比人们通常认为的要小得多。" },
    { num: "②", en: "In fact, they don’t seem to be required at all.", ref: "事实上，他们似乎根本不是（社会流行潮）所必需的。" },
    { num: "③", en: "The researchers’ argument stems from a simple observation about social influence: With the exception of a few celebrities like Oprah Winfrey—whose outsize presence is primarily a function of media, not interpersonal, influence—even the most influential members of a population simply don’t interact with that many others.", ref: "研究人员的观点基于对社会影响的一项简单观察：除了像奥普拉·温弗瑞这样的个别名人——她的非凡影响力主要是媒体影响而非人际影响的作用——即使是一个群体中最具影响力的人也根本不会与那么多的人交往。" },
    { num: "④", en: "Yet it is precisely these non-celebrity influentials who, according to the two-step-flow theory, are supposed to drive social epidemics, by influencing their friends and colleagues directly.", ref: "而根据两级流动理论，恰恰是这些非名人有影响力人士通过直接影响他们的朋友和同事，推动了社会流行潮。" },
    { num: "⑤", en: "For a social epidemic to occur, however, each person so affected must then influence his or her own acquaintances, who must in turn influence theirs, and so on; and just how many others pay attention to each of these people has little to do with the initial influential.", ref: "但是，一种社会流行潮要形成，每个这样受到有影响力人士影响的人都必须接着影响自己的熟人，这些熟人又必须同样地影响他们的熟人，并依次影响下去；这些人中的每个人能得到多少人关注与最初的有影响力人士并无多大关系。" },
    { num: "⑥", en: "If people in the network just two degrees removed from the initial influential prove resistant, for example, the cascade of change won’t propagate very far or affect many people.", ref: "例如，假若此“人际影响网络”中与最初有影响力人士仅相隔两个层级的人们表现出（对这种影响的）无动于衷，那么变化的“瀑布流”就不会传播得太远，或者影响很多人。" }
    ]
  },
  {
    day: 96,
    type: "英一",
    source: "2010 Text 3",
    zh: "以这个关于人际影响的基本事实为基础，研究人员通过对人群进行无数次的计算机模拟、对与人们影响他人的能力以及被他人影响的倾向相关的若干变量进行操纵分析，研究社会影响的动态。他们发现，所谓的“全球瀑布流”——某种影响经由“社交网络”的广泛传播——形成的首要条件并不是少数几个有影响力人士的存在，而是大量必不可少的易受影响人士的参与。",
    sentences: [
    { num: "①", en: "Building on the basic truth about interpersonal influence, the researchers studied the dynamics of social influence by conducting thousands of computer simulations of populations, manipulating a number of variables relating to people’s ability to influence others and their tendency to be influenced.", ref: "以这个关于人际影响的基本事实为基础，研究人员通过对人群进行无数次的计算机模拟、对与人们影响他人的能力以及被他人影响的倾向相关的若干变量进行操纵分析，研究社会影响的动态。" },
    { num: "②", en: "They found that the principal requirement for what is called “global cascades” —the widespread propagation of influence through networks—is the presence not of a few influentials but, rather, of a critical mass of easily influenced people.", ref: "他们发现，所谓的“全球瀑布流”——某种影响经由“社交网络”的广泛传播——形成的首要条件并不是少数几个有影响力人士的存在，而是大量必不可少的易受影响人士的参与。" }
    ]
  },
  {
    day: 97,
    type: "英一",
    source: "2010 Text 4",
    zh: "在公开场合，银行家们一直把遇到的麻烦归咎于自身。背地里，他们却一直将矛头对准他人：会计准则制定者。各家银行抱怨说，他们所制定的规则迫使自己报告巨额损失，这实在不公平。这些规则称，银行必须根据第三方愿意买入的价格而不是管理者和监管机构期望它们售得的价格来评估部分资产。不幸的是，银行的游说现在似乎开始奏效了。细节或许无从知晓，但是对资本市场正常运作至关重要的准则制定者的独立性正在遭受侵害。而且，除非银行以能够吸引买家的价格出售有毒资产，否则，复苏银行系统将会十分困难。",
    sentences: [
    { num: "①", en: "Bankers have been blaming themselves for their troubles in public.", ref: "在公开场合，银行家们一直把遇到的麻烦归咎于自身。" },
    { num: "②", en: "Behind the scenes, they have been taking aim at someone else the accounting standard-setters.", ref: "背地里，他们却一直将矛头对准他人：会计准则制定者。" },
    { num: "③", en: "Their rules, moan the banks, have forced them to report enormous losses, and it’s just not fair.", ref: "各家银行抱怨说，他们所制定的规则迫使自己报告巨额损失，这实在不公平。" },
    { num: "④", en: "These rules say they must value some assets at the price a third party would pay, not the price managers and regulators would like them to fetch.", ref: "这些规则称，银行必须根据第三方愿意买入的价格而不是管理者和监管机构期望它们售得的价格来评估部分资产。" },
    { num: "⑤", en: "Unfortunately, banks’ lobbying now seems to be working.", ref: "不幸的是，银行的游说现在似乎开始奏效了。" },
    { num: "⑥", en: "The details may be unknowable, but the independence of standard-setters, essential to the proper functioning of capital markets, is being compromised.", ref: "细节或许无从知晓，但是对资本市场正常运作至关重要的准则制定者的独立性正在遭受侵害。" },
    { num: "⑦", en: "And, unless banks carry toxic assets at prices that attract buyers, reviving the banking system will be difficult.", ref: "而且，除非银行以能够吸引买家的价格出售有毒资产，否则，复苏银行系统将会十分困难。" }
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
    { num: "①", en: "After a bruising encounter with Congress, America’s Financial Accounting Standards Board (FASB) rushed through rule changes.", ref: "在与国会的一场激烈交锋之后，美国财务会计准则委员会（FASB）匆匆修改了准则。" },
    { num: "②", en: "These gave banks more freedom to use models to value illiquid assets and more flexibility in recognizing losses on long-term assets in their income statements.", ref: "这些修改赋予银行在使用模型评估非流动资产时更多自由、在认定损益表上长期资产损失时更多灵活性。" },
    { num: "③", en: "Bob Herz, the FASB’s chairman, cried out against those who question our motives.", ref: "FASB 主席鲍伯·赫茨强烈反对那些“质疑我们动机”的人。" },
    { num: "④", en: "Yet bank shares rose and the changes enhance what one lobby group politely calls the use of judgment by management.", ref: "然而，银行股票上涨了，而且这些修改增强了某游说团体客气谓之的“管理层判断力的运用”。" },
    { num: "⑤", en: "European ministers instantly demanded that the International Accounting Standards Board (IASB) do likewise.", ref: "欧洲各国部长立刻强烈要求国际会计标准理事会（IASB）采取同样的做法。" },
    { num: "⑥", en: "The IASB says it does not want to act without overall planning, but the pressure to fold when it completes its reconstruction of rules later this year is strong.", ref: "IASB 表示不愿意在没有总体规划的情况下就贸然行动，但当其今年晚些时候完成准则重建时，将会面临巨大的屈服压力。" },
    { num: "⑦", en: "Charlie McCreevy, a European commissioner, warned the IASB that it did not live in a political vacuum but in the real world and the Europe could yet develop different rules.", ref: "欧盟委员会成员查理·迈克里维警告 IASB 说，它“并非生活在政治真空中”，而是“处在现实世界”，而且欧洲迟早会制定不同的规则。" }
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
    { num: "①", en: "It was banks that were on the wrong planet, with accounts that vastly overvalued assets.", ref: "是银行的想法不切实际，它们的账目严重高估了资产。" },
    { num: "②", en: "Today they argue that market prices overstate losses, because they largely reflect the temporary illiquidity of markets, not the likely extent of bad debts.", ref: "如今，银行辩称，市场价格夸大了损失，因为这些价格大多反映的是市场暂时的流动性不足，而不是坏账可能达到的分量。" },
    { num: "③", en: "The truth will not be known for years.", ref: "真相在多年后方可得知。" },
    { num: "④", en: "But banks’ shares trade below their book value, suggesting that investors are skeptical.", ref: "但是，银行股票的交易价格低于其账面价值，这表明投资者持怀疑态度。" },
    { num: "⑤", en: "And dead markets partly reflect the paralysis of banks which will not sell assets for fear of booking losses, yet are reluctant to buy all those supposed bargains.", ref: "另外，市场的萧条也在一定程度上反映出银行的瘫痪。银行因害怕将损失计入账目而不愿出售资产，而同时又不愿收购那些所谓的廉价资产。" }
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
    { num: "①", en: "To get the system working again, losses must be recognized and dealt with.", ref: "要想使银行体系重新运转，必须承认损失并对其做出处理。" },
    { num: "②", en: "America’s new plan to buy up toxic assets will not work unless banks mark assets to levels which buyers find attractive.", ref: "除非银行将有毒资产价格确定在买家觉得有吸引力的水平上，否则美国全面收购有毒资产的新计划就不会起作用。" },
    { num: "③", en: "Successful markets require independent and even combative standard-setters.", ref: "健康的市场需要独立甚至好战的准则制定者。" },
    { num: "④", en: "The FASB and IASB have been exactly that, cleaning up rules on stock options and pensions, for example, against hostility from special interests.", ref: "FASB 和 IASB 过去一直正是如此，例如，（他们）不顾特殊利益集团的强烈反对，对有关股票期权和养老基金方面的（会计）准则进行了整顿。" },
    { num: "⑤", en: "But by giving in to critics now they are inviting pressure to make more concessions.", ref: "但是他们现在对批评者妥协，将由此招致做出更多让步的压力。" }
    ]
  },
  {
    day: 101,
    type: "英二",
    source: "2010 Text 1",
    zh: "2008 年 9 月 15 日伦敦苏富比拍卖行举办的“在我脑海，美丽永恒”主题拍卖会上，随着达米恩·赫斯特的 56 件作品被售出，一个世纪以来艺术品市场最长的牛市也戏剧性地落幕了，除两件作品以外，其余作品全部售出，拍卖总额超过七千万英镑，创造了单个艺术家作品拍卖的最高记录。这是一场最后的胜利。拍卖师喊出报价的同时，纽约华尔街上历史最悠久的银行之一雷曼兄弟也申请了破产。世界艺术品市场在经历了自 2003 年以来的急剧增长后，相当长一段时间以来都失去了其原有的发展势头。据艺术经济学研究公司的创始人克莱尔·麦克安德鲁估算，在 2007 年的顶峰时期，艺术品市场价值约为 650 亿美元，是五年前的两倍。从那以后，该价值可能已降至500 亿美元。但这一市场产生的利益远远超出它本身的规模，因为它将巨额财富、自负、贪婪、激情和争议以一种其他行业无法比拟的方式汇集在了一起。",
    sentences: [
    { num: "①", en: "The longest bull run in a century of art-market history ended on a dramatic note with a sale of 56 works by Damien Hirst, Beautiful Inside My Head Forever, at Sotheby’s in London on September 15th, 2008. All but two pieces sold, fetching more than £ 70m, a record for a sale by a single artist.", ref: "2008 年 9 月 15 日伦敦苏富比拍卖行举办的“在我脑海，美丽永恒”主题拍卖会上，随着达米恩·赫斯特的 56 件作品被售出，一个世纪以来艺术品市场最长的牛市也戏剧性地落幕了，除两件作品以外，其余作品全部售出，拍卖总额超过七千万英镑，创造了单个艺术家作品拍卖的最高记录。" },
    { num: "②", en: "It was a last victory.", ref: "这是一场最后的胜利。" },
    { num: "③", en: "As the auctioneer called out bids, in New York one of the oldest banks on Wall Street, Lehman Brothers, filed for bankruptcy.", ref: "拍卖师喊出报价的同时，纽约华尔街上历史最悠久的银行之一雷曼兄弟也申请了破产。" },
    { num: "④", en: "The world art market had already been losing momentum for a while after rising bewilderingly since 2003.", ref: "世界艺术品市场在经历了自 2003 年以来的急剧增长后，相当长一段时间以来都失去了其原有的发展势头。" },
    { num: "⑤", en: "At its peak in 2007 it was worth some $ 65 billion, reckons Clare McAndrew, founder of Arts Economics, a research firm—double the figure five years earlier.", ref: "据艺术经济学研究公司的创始人克莱尔·麦克安德鲁估算，在 2007 年的顶峰时期，艺术品市场价值约为 650 亿美元，是五年前的两倍。" },
    { num: "⑥", en: "Since then it may have come down to $50 billion.", ref: "从那以后，该价值可能已降至500 亿美元。" },
    { num: "⑦", en: "But the market generates interest far beyond its size because it brings together great wealth, enormous egos, greed, passion and controversy in a way matched by few other industries.", ref: "但这一市场产生的利益远远超出它本身的规模，因为它将巨额财富、自负、贪婪、激情和争议以一种其他行业无法比拟的方式汇集在了一起。" }
    ]
  },
  {
    day: 102,
    type: "英二",
    source: "2010 Text 1",
    zh: "赫斯特作品拍卖之后的一段时间内，任何种类的消费都变得极其不合时宜在艺术品领域，这意味着收藏家远离了画廊和拍卖场。2008 年当年截至 11 月，当代艺术品的销售额下降了2/3，而在其最热门的领域则下降了近 90%。几周之内，全球最大的两家拍卖行，苏富比和佳士得，不得不向那些将艺术品交由它们售卖的客户支付将近 2 亿美元的保证金。",
    sentences: [
    { num: "①", en: "In the weeks and months that followed Mr. Hirst’s sale, spending of any sort became deeply unfashionable.", ref: "赫斯特作品拍卖之后的一段时间内，任何种类的消费都变得极其不合时宜。" },
    { num: "②", en: "In the art world that meant collectors stayed away from galleries and salerooms.", ref: "在艺术品领域，这意味着收藏家远离了画廊和拍卖场。" },
    { num: "③", en: "Sales of contemporary art fell by two-thirds, and in the most overheated sector, they were down by nearly 90% in the year to November 2008.", ref: "2008 年当年截至 11 月，当代艺术品的销售额下降了2/3，而在其最热门的领域则下降了近 90%。" },
    { num: "④", en: "Within weeks the world’s two biggest auction houses, Sotheby’s and Christie’s, had to pay out nearly $200m in guarantees to clients who had placed works for sale with them.", ref: "几周之内，全球最大的两家拍卖行，苏富比和佳士得，不得不向那些将艺术品交由它们售卖的客户支付将近 2 亿美元的保证金。" }
    ]
  },
  {
    day: 103,
    type: "英二",
    source: "2010 Text 1",
    zh: "当前艺术品市场的下滑是自 1989 年底日本停止购买印象派作品以来最糟糕的一次。专家估计这次下滑使艺术品价值较之其峰值平均下跌了约 40%，不过有些艺术品价格的波动幅度更大。但是佳士得的首席执行官 Edward Dolman 说:“我非常肯定我们现在已处于谷底。”他说，此次衰退不同于上次的地方在于现在市场上仍然有买家。几乎所有接受此次特别报道的受访者都说，当前最大的问题不是缺少需求，而是缺少好的售卖作品。3D——死亡、债务和离婚——依然是将艺术品推向市场的三大因素。但那些不是非卖不可的人都在远离市场，等待市场信心的回转。",
    sentences: [
    { num: "①", en: "The current downturn in the art market is the worst since the Japanese stopped buying Impressionists at the end of 1989.", ref: "当前艺术品市场的下滑是自 1989 年底日本停止购买印象派作品以来最糟糕的一次。" },
    { num: "②", en: "This time experts reckon that prices are about 40% down on their peak on average, though some have been far more fluctuant.", ref: "专家估计这次下滑使艺术品价值较之其峰值平均下跌了约 40%，不过有些艺术品价格的波动幅度更大。" },
    { num: "③", en: "But Edward Dolman, Christie’s chief executive, says: “I’m pretty confident we’re at the bottom.”", ref: "但是佳士得的首席执行官 Edward Dolman 说:“我非常肯定我们现在已处于谷底。" },
    { num: "④", en: "What makes this slump different from the last, he says, is that there are still buyers in the market.", ref: "他说，此次衰退不同于上次的地方在于现在市场上仍然有买家。" },
    { num: "⑤", en: "Almost everyone who was interviewed for this special report said that the biggest problem at the moment is not a lack of demand but a lack of good work to sell.", ref: "几乎所有接受此次特别报道的受访者都说，当前最大的问题不是缺少需求，而是缺少好的售卖作品。" },
    { num: "⑥", en: "The three Ds—death, debt and divorce—still deliver works of art to the market.", ref: "3D——死亡、债务和离婚——依然是将艺术品推向市场的三大因素。" },
    { num: "⑦", en: "But anyone who does not have to sell is keeping away, waiting for confidence to return.", ref: "但那些不是非卖不可的人都在远离市场，等待市场信心的回转。" }
    ]
  },
  {
    day: 104,
    type: "英二",
    source: "2010 Text 2",
    zh: "在弗吉尼亚郊区一个住所的客厅里，我正在一次小型聚会上发言——那是一个女性团体，但也邀请了男性参加。整个晚上，有位男士表现得特别健谈，频繁地发表观点、讲述趣闻轶事，而他的妻子则静静地坐在他身旁的沙发上。聚会接近尾声时，我评论说，女人经常会抱怨丈夫不与自己交谈。这位男士立即点头表示同意。他指了指妻子说:“她是我们家的话匣子。”满屋哄堂大笑；这位男士一脸茫然和受伤。“这是真的，”他解释说。“我下班回家后总是无话可说。如果她不一直和我说话，我们整晚都会在沉默中度过。”这段情节证明了一种具有讽刺意味的现象确实存在：尽管美国男性在公共场合常常比女性更加健谈，在家里却比妻子话少。而正是这种模式正在严重破坏婚姻。",
    sentences: [
    { num: "①", en: "I was addressing a small gathering in a suburban Virginia living room—a women’s group that had invited men to join them.", ref: "在弗吉尼亚郊区一个住所的客厅里，我正在一次小型聚会上发言——那是一个女性团体，但也邀请了男性参加。" },
    { num: "②", en: "Throughout the evening, one man had been particularly talkative, frequently offering ideas and anecdotes, while his wife sat silently beside him on the couch.", ref: "整个晚上，有位男士表现得特别健谈，频繁地发表观点、讲述趣闻轶事，而他的妻子则静静地坐在他身旁的沙发上。" },
    { num: "③", en: "Toward the end of the evening, I commented that women frequently complain that their husbands don’t talk to them.", ref: "聚会接近尾声时，我评论说，女人经常会抱怨丈夫不与自己交谈。" },
    { num: "④", en: "This man quickly nodded in agreement.", ref: "这位男士立即点头表示同意。" },
    { num: "⑤", en: "He gestured toward his wife and said, “She’s the talker in our family.”", ref: "他指了指妻子说:“她是我们家的话匣子。" },
    { num: "⑥", en: "The room burst into laughter; the man looked puzzled and hurt.", ref: "满屋哄堂大笑；这位男士一脸茫然和受伤。" },
    { num: "⑦", en: "“It’s true,” he explained.", ref: "“这是真的，”他解释说。" },
    { num: "⑧", en: "“When I come home from work I have nothing to say.", ref: "“我下班回家后总是无话可说。" },
    { num: "⑨", en: "If she didn’t keep the conversation going, we’d spend the whole evening in silence.”", ref: "如果她不一直和我说话，我们整晚都会在沉默中度过。" },
    { num: "⑩", en: "This episode crystallizes the irony that although American men tend to talk more than women in public situations, they often talk less at home.", ref: "这段情节证明了一种具有讽刺意味的现象确实存在：尽管美国男性在公共场合常常比女性更加健谈，在家里却比妻子话少。" },
    { num: "⑪", en: "And this pattern is wreaking havoc with marriage.", ref: "而正是这种模式正在严重破坏婚姻。" }
    ]
  },
  {
    day: 105,
    type: "英二",
    source: "2010 Text 2",
    zh: "20 世纪 70 年代末，政治学家 AndrewHacker 就注意到了这种模式。社会学家 Catherine KohlerRiessman 在其新书《离婚谈》中提到，她所访问的绝大多数女性将其离婚归咎于“缺乏沟通”，但只有极少数男性如此认为。鉴于美国目前接近 50%的离婚率，这（缺乏沟通）每年会导致美国几百万离婚案例的产生——可谓是沟通不良引发的传染病。",
    sentences: [
    { num: "①", en: "The pattern was observed by political scientist Andrew Hacker in the late 1970s.", ref: "20 世纪 70 年代末，政治学家 AndrewHacker 就注意到了这种模式。" },
    { num: "②", en: "Sociologist Catherine Kohler Riessman reports in her new book Divorce Talk that most of the women she interviewed—but only a few of the men—gave lack of communication as the reason for their divorces.", ref: "社会学家 Catherine KohlerRiessman 在其新书《离婚谈》中提到，她所访问的绝大多数女性将其离婚归咎于“缺乏沟通”，但只有极少数男性如此认为。" },
    { num: "③", en: "Given the current divorce rate of nearly 50 percent, that amounts to millions of cases in the United States every year—a virtual epidemic of failed conversation.", ref: "鉴于美国目前接近 50%的离婚率，这（缺乏沟通）每年会导致美国几百万离婚案例的产生——可谓是沟通不良引发的传染病。" }
    ]
  },
  {
    day: 106,
    type: "英二",
    source: "2010 Text 2",
    zh: "据我的个人研究，女性对丈夫的抱怨大多不是集中在一些看得见摸得着的不平等现象，例如为陪伴丈夫追随他的事业而放弃了发展自己事业的机会，或者她们所承担的日常生活琐事远远超过她们份内的部分，如清洁、下厨和安排社交活动。相反，她们的抱怨总是集中在交流问题上，如“他不听我说话”，“他不和我说话”。与 Hacker 几年前发现的一样，我发现多数妻子都期望丈夫首先是自己的交谈伙伴，但是很少有丈夫对妻子抱有同样的期望。简言之，最能形象表现目前这种危机的是这样一幅经典漫画场景:一个男人坐在早餐桌边，手中报纸挡着他的脸，一个女人怒视着报纸背面，很想交谈。",
    sentences: [
    { num: "①", en: "In my own research, complaints from women about their husbands most often focused not on tangible inequities such as having given up the chance for a career to accompany a husband to his, or doing far more than their share of daily life-support work like cleaning, cooking, social arrangements.", ref: "据我的个人研究，女性对丈夫的抱怨大多不是集中在一些看得见摸得着的不平等现象，例如为陪伴丈夫追随他的事业而放弃了发展自己事业的机会，或者她们所承担的日常生活琐事远远超过她们份内的部分，如清洁、下厨和安排社交活动。" },
    { num: "②", en: "Instead, they focused on communication: “He doesn’t listen to me,” “He doesn’t talk to me.”", ref: "相反，她们的抱怨总是集中在交流问题上，如“他不听我说话”，“他不和我说话”。" },
    { num: "③", en: "I found, as Hacker observed years before, that most wives want their husbands to be, first and foremost, conversational partners, but few husbands share this expectation of their wives.", ref: "与 Hacker 几年前发现的一样，我发现多数妻子都期望丈夫首先是自己的交谈伙伴，但是很少有丈夫对妻子抱有同样的期望。" },
    { num: "④", en: "In short, the image that best represents the current crisis is the stereotypical cartoon scene of a man sitting at the breakfast table with a newspaper held up in front of his face, while a woman glares at the back of it, wanting to talk.", ref: "简言之，最能形象表现目前这种危机的是这样一幅经典漫画场景:一个男人坐在早餐桌边，手中报纸挡着他的脸，一个女人怒视着报纸背面，很想交谈。" }
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
    { num: "①", en: "Over the past decade, many companies had perfected the art of creating automatic behaviors—habits—among consumers.", ref: "过去十年来，许多公司已经把“在消费者中生成自动行为——习惯”这一艺术发展到了完美的地步。" },
    { num: "②", en: "These habits have helped companies earn billions of dollars when customers eat snacks or wipe counters almost without thinking, often in response to a carefully designed set of daily cues.", ref: "当消费者响应一系列精心设计的日常暗示、几乎不假思索地吃零食或擦桌台之时，这些习惯已经帮助公司赚取了数十亿美元。" },
    { num: "③", en: "“There are fundamental public health problems, like dirty hands instead of a soap habit, that remain killers only because we can’t figure out how to change people’s habits,” said Dr. Curtis, the director of the Hygiene Center at the London School of Hygiene & Tropical Medicine.", ref: "伦敦卫生和热带医药学院卫生中心主任柯提斯博士称，“一些基本的公共卫生问题，比如说，手脏了却没有养成用肥皂清洗的习惯，只因为我们无法弄清如何改变人们的习惯，这些问题在继续夺取人们的生命。" },
    { num: "④", en: "“We wanted to learn from private industry how to create new behaviors that happen automatically.”", ref: "我们想要向私营企业学习如何塑造新的自动行为。”" }
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
    { num: "①", en: "The companies that Dr. Curtis turned to—Procter & Gamble, Colgate-Palmolive and Unilever—had invested hundreds of millions of dollars finding the subtle cues in consumers’ lives that corporations could use to introduce new routines.", ref: "柯提斯博士求助的公司有宝洁、高露洁和联合利华，这些公司曾投资几亿美元用于发掘消费者生活中的微妙暗示，并利用它们引入新惯例。" },
    { num: "②", en: "If you look hard enough, you’ll find that many of the products we use every day—chewing gums, skin moisturizers, disinfecting wipes, air fresheners, water purifiers, health snacks, teeth whiteners, fabric softeners, vitamins—are results of manufactured habits.", ref: "如果你观察得足够仔细，就会发现我们每天都在使用的许多产品——口香糖、润肤乳、消毒湿巾、空气清新剂、净水器健康小吃、牙齿美白剂、衣物柔顺剂、维生素等，都是“制造习惯”的产物。" },
    { num: "③", en: "A century ago, few people regularly brushed their teeth multiple times a day.", ref: "一个世纪以前，很少有人习惯性地一天刷牙多次。" },
    { num: "④", en: "Today, because of shrewd advertising and public health campaigns, many Americans habitually give their pearly whites a cavity-preventing scrub twice a day, often with Colgate, Crest or one of the other brands.", ref: "而今天，受精明的广告活动和公共卫生运动的影响，许多美国人会习惯性地每天给他们那如珍珠般洁白的牙齿做两次龋齿预防刷洗，他们使用的，往往就是高露洁、佳洁士或者其他某种品牌。" }
    ]
  },
  {
    day: 109,
    type: "英二",
    source: "2010 Text 3",
    zh: "几十年之前，许多人不会在非就餐时间喝水。后来，饮料公司开始将遥远地带的泉水装入瓶中，现在办公室职员整天都在不假思索地喝着瓶装水。口香糖从前主要是处于青春期的男孩儿购买，而现在的商业广告中，口香糖被定位为饭后使用的口气清新剂和牙齿清洁剂。润肤乳被广告宣传成早晨美容程序的一部分，不知不觉插入梳头和化妆之间。",
    sentences: [
    { num: "①", en: "A few decades ago, many people didn’t drink water outside of a meal.", ref: "几十年之前，许多人不会在非就餐时间喝水。" },
    { num: "②", en: "Then beverage companies started bottling the production of far-off springs, and now office workers unthinkingly sip bottled water all day long.", ref: "后来，饮料公司开始将遥远地带的泉水装入瓶中，现在办公室职员整天都在不假思索地喝着瓶装水。" },
    { num: "③", en: "Chewing gum, once bought primarily by adolescent boys, is now featured in commercials as a breath freshener and teeth cleanser for use after a meal.", ref: "口香糖从前主要是处于青春期的男孩儿购买，而现在的商业广告中，口香糖被定位为饭后使用的口气清新剂和牙齿清洁剂。" },
    { num: "④", en: "Skin moisturizers are advertised as part of morning beauty rituals, slipped in between hair brushing and putting on makeup.", ref: "润肤乳被广告宣传成早晨美容程序的一部分，不知不觉插入梳头和化妆之间。" }
    ]
  },
  {
    day: 110,
    type: "英二",
    source: "2010 Text 3",
    zh: "最近从宝洁退休的消费心理学家卡罗尔·伯宁说:“如果能成为每天或每周的惯例，那我们的产品就成功了”。宝洁公司去年卖出了 760 亿美元的汰渍、佳洁士和其他产品。“生成积极习惯是改善消费者生活的重要部分，它也对使新产品具有商业可行性至关重要。”通过实验和观察，伯宁博士等社会科学家已了解到，通过大量无休止的广告将“某些行为”与“习惯暗示”联系起来的做法是有效的。随着这门新兴习惯科学的兴起，这些策略被用于销售价值尚属疑问的美容霜或者不健康的食品，从而引发了激烈辩论。",
    sentences: [
    { num: "①", en: "“Our products succeed when they become part of daily or weekly patterns,” said Carol Berning, a consumer psychologist who recently retired from Procter & Gamble, the company that sold $76 billion of Tide, Crest and other products last year.", ref: "最近从宝洁退休的消费心理学家卡罗尔·伯宁说：“如果能成为每天或每周的惯例，那我们的产品就成功了”。宝洁公司去年卖出了 760 亿美元的汰渍、佳洁士和其他产品。" },
    { num: "②", en: "“Creating positive habits is a huge part of improving our consumers’ lives, and it’s essential to making new products commercially viable.”", ref: "创建积极习惯是改善消费者生活的重要部分，它也对使新产品具有商业可行性至关重要。" },
    { num: "③", en: "Through experiments and observation, social scientists like Dr. Berning have learned that there is power in tying certain behaviors to habitual cues through ruthless advertising.", ref: "通过实验和观察，伯宁博士等社会科学家已了解到，通过大量无休止的广告将“某些行为”与“习惯暗示”联系起来的做法是有效的。" },
    { num: "④", en: "As this new science of habit has emerged, controversies have erupted when the tactics have been used to sell questionable beauty creams or unhealthy foods.", ref: "随着这门新兴习惯科学的兴起，这些策略被用于销售价值尚属疑问的美容霜或者不健康的食品，从而引发了激烈辩论。" }
    ]
  },
  {
    day: 111,
    type: "英二",
    source: "2010 Text 4",
    zh: "许多美国人把陪审团制度看作是关键民主价值观的具体表现，该制度包括以下原则：所有满足最低年龄和文化要求的公民都具备同等资格担任陪审员；陪审员应从社会各部门的典型代表中随机挑选；任何公民不得由于种族、宗教、性别和民族出身被剥夺担任陪审员的权利；被告人有权利接受由同等地位的人进行的审判；审判结果应该代表社会良知，而不仅仅是法律条文的字面意义。陪审团还被看作是体现直接民主而非代议制民主的最佳现存典范。在直接民主政体中，公民轮流进行自治，而不是选举代表来替自己治理。",
    sentences: [
    { num: "①", en: "Many Americans regard the jury system as a concrete expression of crucial democratic values, including the principles that all citizens who meet minimal qualifications of age and literacy are equally competent to serve on juries; that jurors should be selected randomly from a representative cross section of the community; that no citizen should be denied the right to serve on a jury on account of race, religion, sex, or national origin; that defendants are entitled to trial by their peers; and that verdicts should represent the conscience of the community and not just the letter of the law.", ref: "许多美国人把陪审团制度看作是关键民主价值观的具体表现，该制度包括以下原则：所有满足最低年龄和文化要求的公民都具备同等资格担任陪审员；陪审员应从社会各部门的典型代表中随机挑选；任何公民不得由于种族、宗教、性别和民族出身被剥夺担任陪审员的权利；被告人有权利接受由同等地位的人进行的审判；审判结果应该代表社会良知，而不仅仅是法律条文的字面意义。" },
    { num: "②", en: "The jury is also said to be the best surviving example of direct rather than representative democracy.", ref: "陪审团还被看作是体现直接民主而非代议制民主的最佳现存典范。" },
    { num: "③", en: "In a direct democracy, citizens take turns governing themselves, rather than electing representatives to govern for them.", ref: "在直接民主政体中，公民轮流进行自治，而不是选举代表来替自己治理。" }
    ]
  },
  {
    day: 112,
    type: "英二",
    source: "2010 Text 4",
    zh: "但是近至 1968 年，陪审团遴选程序仍然是和这些民主理想相冲突的。例如，在有些州，陪审团职责仅限于由那些一般看来智商学历和道德品格高人一等的人来承担。尽管美国最高法院早在 1880 年的斯特劳德诉西弗吉尼亚州一案中就已经禁止了陪审团遴选中的蓄意种族歧视，但挑选所谓的精英陪审员或者蓝带陪审员的做法，却为绕开这一反歧视及其它反歧视法案提供了一条捷径。【帮你搜索】“蓝带陪审员”（blue-ribbon jury）通常是指由一些具有特殊背景、专业知识或社会地位的人组成的陪审员团队。在一些情况下，选择蓝带陪审员可能是为了确保案件的审判能够更加公正、专业或具有代表性。在美国，蓝带陪审员的概念可能与一些历史和法律背景有关。例如，早在 19 世纪末，美国最高法院就禁止了在陪审团遴选中的蓄意种族歧视，但后来挑选所谓的精英或蓝带陪审员的做法成为了一种绕过反歧视法律的方式。在其他国家或法律体系中，可能也存在类似的概念或做法，但具体含义和应用可能会有所不同。",
    sentences: [
    { num: "①", en: "But as recently as in 1968, jury selection procedures conflicted with these democratic ideals.", ref: "但是近至 1968 年，陪审团遴选程序仍然是和这些民主理想相冲突的。" },
    { num: "②", en: "In some states, for example, jury duty was limited to persons of supposedly superior intelligence, education, and moral character.", ref: "例如，在有些州，陪审团职责仅限于由那些一般看来智商学历和道德品格高人一等的人来承担。" },
    { num: "③", en: "Although the Supreme Court of the United States had prohibited intentional racial discrimination in jury selection as early as the 1880 case of Strauder v. West Virginia, the practice of selecting so-called elite or blue-ribbon juries provided a convenient way around this and other antidiscrimination laws.", ref: "尽管美国最高法院早在 1880 年的斯特劳德诉西弗吉尼亚州一案中就已经禁止了陪审团遴选中的蓄意种族歧视，但挑选所谓的精英陪审员或者蓝带陪审员的做法，却为绕开这一反歧视及其它反歧视法案提供了一条捷径。" }
    ]
  },
  {
    day: 113,
    type: "英二",
    source: "2010 Text 4",
    zh: "同时，直到 20 世纪中叶，陪审团制度才开始常规地将女性纳入其中。虽然早在 1898 年，女性就首次担任过犹他州的陪审员，但直到 20 世纪 40 年代，大多数州才赋予女性承担陪审员职责的资格。而且即便是那时，有些州仍然自动将女性排除在陪审员职责之外，除非她们自己要求将名字纳入陪审团名单。这种做法以家里需要女性的论断为解释依据，致使整个 20世纪 60 年代的陪审团中都鲜有女性。",
    sentences: [
    { num: "①", en: "The system also failed to regularly include women on juries until the mid-20th century.", ref: "同时，直到 20 世纪中叶，陪审团制度才开始常规地将女性纳入其中。" },
    { num: "②", en: "Although women first served on state juries in Utah in 1898, it was not until the 1940s that a majority of states made women eligible for jury duty.", ref: "虽然早在 1898 年，女性就首次担任过犹他州的陪审员，但直到 20 世纪 40 年代，大多数州才赋予女性承担陪审员职责的资格。" },
    { num: "③", en: "Even then several states automatically exempted women from jury duty unless they personally asked to have their names included on the jury list.", ref: "而且即便是那时，有些州仍然自动将女性排除在陪审员职责之外，除非她们自己要求将名字纳入陪审团名单。" },
    { num: "④", en: "This practice was justified by the claim that women were needed at home, and it kept juries unrepresentative of women through the 1960s.", ref: "这种做法以家里需要女性的论断为解释依据，致使整个 20世纪 60 年代的陪审团中都鲜有女性。" }
    ]
  },
  {
    day: 114,
    type: "英二",
    source: "2010 Text 4",
    zh: "1968 年，美国国会通过了《陪审团遴选与服务法案》，从此开创了一个陪审团民主改革的新时代。这一法案废除了对联邦陪审员的特殊教育要求，并要求从社会各阶层民众中随机挑选陪审员。在 1975 年泰勒诉路易斯安那州一案里程碑式的裁定中，最高法院将陪审团成员需代表社会各阶层这一要求延伸至州级层面。泰勒案的裁决同时将陪审团遴选中的性别歧视宣布为违宪，并命令各州采取相同程序来遴选男女陪审员。",
    sentences: [
    { num: "①", en: "In 1968, the Congress of the United States passed the Jury Selection and Service Act, ushering in a new era of democratic reforms for the jury.", ref: "1968 年，美国国会通过了《陪审团遴选与服务法案》，从此开创了一个陪审团民主改革的新时代。" },
    { num: "②", en: "This law abolished special educational requirements for federal jurors and required them to be selected at random from a cross section of the entire community.", ref: "这一法案废除了对联邦陪审员的特殊教育要求，并要求从社会各阶层民众中随机挑选陪审员。" },
    { num: "③", en: "In the landmark 1975 decision Taylor v. Louisiana, the Supreme Court extended the requirement that juries be representative of all parts of the community to the state level.", ref: "在 1975 年泰勒诉路易斯安那州一案里程碑式的裁定中，最高法院将陪审团成员需代表社会各阶层这一要求延伸至州级层面。" },
    { num: "④", en: "The Taylor decision also declared sex discrimination in jury selection to be unconstitutional and ordered states to use the same procedures for selecting male and female jurors.", ref: "泰勒案的裁决同时将陪审团遴选中的性别歧视宣布为违宪，并命令各州采取相同程序来遴选男女陪审员。" }
    ]
  },
  {
    day: 115,
    type: "英二",
    source: "2011 Text 1",
    zh: "2000 年 1 月，茹斯·西蒙斯作为外部董事加入高盛集团；时隔一年，她成为布朗大学校长。随后的九年里，她似乎设法做到了在没有招致太多非议的同时处理两个角色。到了 2009 年底，西蒙斯女士却因在高盛薪酬委员会的任职而遭受抨击；她怎么能让那些巨额奖金支出毫无察觉地就通过了呢？到第二年 2 月，西蒙斯女士已离开董事会。她说，这个职位太占时间了。【帮你搜索】外部董事，又称非执行董事或独立董事，是指不在公司享有董事职责外的经营管理权的董事会董事。他们不直接参与企业的日常经营管理，主要职责是监督、审查和平衡，以维护公众利益和少数股东的权益。同时，外部董事还需要跟踪和关注公司的运营数据和信息，为公司高级管理层提供有价值的见解。",
    sentences: [
    { num: "①", en: "Ruth Simmons joined Goldman Sachs’s board as an outside director in January 2000; a year later she became president of Brown University.", ref: "2000 年 1 月，茹斯·西蒙斯作为外部董事加入高盛集团；时隔一年，她成为布朗大学校长。" },
    { num: "②", en: "For the rest of the decade she apparently managed both roles without attracting much criticism.", ref: "随后的九年里，她似乎设法做到了在没有招致太多非议的同时处理两个角色。" },
    { num: "③", en: "But by the end of 2009 Ms. Simmons was under fire for having sat on Goldman’s compensation committee; how could she have let those enormous bonus payouts pass unremarked?", ref: "到了 2009 年底，西蒙斯女士却因在高盛薪酬委员会的任职而遭受抨击；她怎么能让那些巨额奖金支出毫无察觉地就通过了呢？" },
    { num: "④", en: "By February the next year Ms. Simmons had left the board.", ref: "到第二年 2 月，西蒙斯女士已离开董事会。" },
    { num: "⑤", en: "The position was just taking up too much time, she said.", ref: "她说，这个职位太占时间了。" }
    ]
  },
  {
    day: 116,
    type: "英二",
    source: "2011 Text 1",
    zh: "外部董事被认为是公司董事会中有益且更公正的顾问。他们已在别处名成利就，因此应拥有足够的独立性来质疑董事长的提案。假若公司面临灭顶之灾，股票价格大跌，外部董事应能基于自身应付危机的经验向公司提出建议。",
    sentences: [
    { num: "①", en: "Outside directors are supposed to serve as helpful, yet less biased, advisers on a firm’s board.", ref: "外部董事被认为是公司董事会中有益且更公正的顾问。" },
    { num: "②", en: "Having made their wealth and their reputations elsewhere, they presumably have enough independence to disagree with the chief executive’s proposals.", ref: "他们已在别处名成利就，因此应拥有足够的独立性来质疑董事长的提案。" },
    { num: "③", en: "If the sky, and the share price is falling, outside directors should be able to give advice based on having weathered their own crises.", ref: "假若公司面临灭顶之灾，股票价格大跌，外部董事应能基于自身应付危机的经验向公司提出建议。" }
    ]
  },
  {
    day: 117,
    type: "英二",
    source: "2011 Text 1",
    zh: "来自俄亥俄大学的研究者利用一个数据库（对外部董事）进行了研究，该数据库涵盖从 1989年到 2004 年 10000 多家公司和 64000 多名董事的信息。然后他们只是核查了有哪些在同一公司连任的留任董事。离开董事会最有可能的原因是年龄问题，因此研究者集中关注那些年龄在 70 岁以下“突然”离职的董事。他们发现，（董事）突然离职后，其所在公司随后需要重申盈利的可能性增加了近 20%。公司在联邦集体诉讼中被提及的可能性也随之增加，且公司股票也可能表现更糟。公司越大往往受的影响也越大。尽管研究表明“董事离职”与“公司随后糟糕表现”之间具有相关性，但这并不意味着这些董事总是在“跳离沉船”。他们通常是在“另谋高就”，离开风险较高的小公司而去往更稳定的大公司。",
    sentences: [
    { num: "①", en: "The researchers from Ohio University used a database that covered more than 10,000 firms and more than 64,000 different directors between 1989 and 2004.", ref: "来自俄亥俄大学的研究者利用一个数据库（对外部董事）进行了研究，该数据库涵盖从 1989年到 2004 年 10000 多家公司和 64000 多名董事的信息。" },
    { num: "②", en: "Then they simply checked which directors stayed from one proxy statement to the next.", ref: "然后他们只是核查了有哪些在同一公司连任的留任董事。" },
    { num: "③", en: "The most likely reason for departing a board was age, so the researchers concentrated on those “surprise” disappearances by directors under the age of 70.", ref: "离开董事会最有可能的原因是年龄问题，因此研究者集中关注那些年龄在 70 岁以下“突然”离职的董事。" },
    { num: "④", en: "They found that after a surprise departure, the probability that the company will subsequently have to restate earnings increases by nearly 20%.", ref: "他们发现，（董事）突然离职后，其所在公司随后需要重申盈利的可能性增加了近 20%。" },
    { num: "⑤", en: "The likelihood of being named in a federal class-action lawsuit also increases, and the stock is likely to perform worse.", ref: "公司在联邦集体诉讼中被提及的可能性也随之增加，且公司股票也可能表现更糟。" },
    { num: "⑥", en: "The effect tended to be larger for larger firms.", ref: "公司越大往往受的影响也越大。" },
    { num: "⑦", en: "Although a correlation between them leaving and subsequent bad performance at the firm is suggestive, it does not mean that such directors are always jumping off a sinking ship.", ref: "尽管研究表明“董事离职”与“公司随后糟糕表现”之间具有相关性，但这并不意味着这些董事总是在“跳离沉船”。" },
    { num: "⑧", en: "Often they “trade up,” leaving riskier, smaller firms for larger and more stable firms.", ref: "他们通常是在“另谋高就”，离开风险较高的小公司而去往更稳定的大公司。" }
    ]
  },
  {
    day: 118,
    type: "英二",
    source: "2011 Text 1",
    zh: "但研究者认为，如果外部董事在坏消息爆发前就已离开公司，那么他们会更容易避免声誉受损——即便历史记录显示“错误行为出现时，董事们尚在其职”（依然如此）。那些想要在困难时期留住外部董事的公司可能需要采取激励措施。否则外部董事就会效仿西蒙斯女士，离开董事会，在校园重获欢迎。",
    sentences: [
    { num: "①", en: "But the researchers believe that outside directors have an easier time of avoiding a blow to their reputations if they leave a firm before bad news breaks, even if a review of history shows they were on the board at the time any wrongdoing occurred.", ref: "但研究者认为，如果外部董事在坏消息爆发前就已离开公司，那么他们会更容易避免声誉受损——即便历史记录显示“错误行为出现时，董事们尚在其职”（依然如此）。" },
    { num: "②", en: "Firms who want to keep their outside directors through tough times may have to create incentives.", ref: "那些想要在困难时期留住外部董事的公司可能需要采取激励措施。" },
    { num: "③", en: "Otherwise outside directors will follow the example of Ms. Simmons, once again very popular on campus.", ref: "否则外部董事就会效仿西蒙斯女士，离开董事会，在校园重获欢迎。" }
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
    { num: "①", en: "Whatever happened to the death of newspapers?", ref: "报纸业的消亡（之势）到底遇到了什么情况？" },
    { num: "②", en: "A year ago the end seemed near.", ref: "一年前，末日似乎近在咫尺。" },
    { num: "③", en: "The recession threatened to remove the advertising and readers that had not already fled to the Internet.", ref: "经济衰退差点将仅存的还未转至互联网的广告及读者彻底清除。" },
    { num: "④", en: "Newspapers like the San Francisco Chronicle were chronicling their own doom.", ref: "像《旧金山纪事报》这类报纸已经着手记录自己的劫数了。" },
    { num: "⑤", en: "America’s Federal Trade Commission launched a round of talks about how to save newspapers.", ref: "美国联邦贸易委员会发起了一轮如何拯救报纸业的会谈。" },
    { num: "⑥", en: "Should they become charitable corporations?", ref: "它们是否应该转型成公益企业？" },
    { num: "⑦", en: "Should the state subsidize them?", ref: "政府是否应该给予其补贴？" },
    { num: "⑧", en: "It will hold another meeting soon.", ref: "委员会即将再次召开一场讨论会。" },
    { num: "⑨", en: "But the discussions now seem out of date.", ref: "但现在看来这些讨论似乎已经不合时宜了。" }
    ]
  },
  {
    day: 120,
    type: "英二",
    source: "2011 Text 2",
    zh: "现在全球大多数地区几乎没有危机迹象。德国和巴西的报纸业已经摆脱了经济衰退。甚至连全球报纸业中处境最艰难的美国报纸业不仅也挺了过来，而且还基本恢复盈利。虽不及几年前通常 20%的利润空间，但毕竟是有钱可赚。（但）情况也不是太乐观。多家报社通过裁员来维持运营。据美国新闻编辑协会估算，2007年以来有 1.35 万个新闻编辑工作岗位消失了。读者付费更多却获得缩水的内容。一些报社甚至敢拒绝向边远郊区递送报纸。不过，这些孤注一掷的举措证明是对的，只是不幸的是，对于许多新闻工作者来说，他们可能遭到进一步的裁员。",
    sentences: [
    { num: "①", en: "In much of the world there is little sign of crisis.", ref: "现在全球大多数地区几乎没有危机迹象。" },
    { num: "②", en: "German and Brazilian papers have shrugged off the recession.", ref: "德国和巴西的报纸业已经摆脱了经济衰退。" },
    { num: "③", en: "Even American newspapers, which inhabit the most troubled corner of the global industry, have not only survived but often returned to profit.", ref: "甚至连全球报纸业中处境最艰难的美国报纸业不仅也挺了过来，而且还基本恢复盈利。" },
    { num: "④", en: "Not the 20% profit margins that were routine a few years ago, but profit all the same.", ref: "虽不及几年前通常 20%的利润空间，但毕竟是有钱可赚。" },
    { num: "⑤", en: "It has not been much fun.", ref: "（但）情况也不是太乐观。" },
    { num: "⑥", en: "Many papers stayed afloat by pushing journalists overboard.", ref: "多家报社通过裁员来维持运营。" },
    { num: "⑦", en: "The American Society of News Editors reckons that 13,500 newsroom jobs have gone since 2007.", ref: "据美国新闻编辑协会估算，2007年以来有 1.35 万个新闻编辑工作岗位消失了。" },
    { num: "⑧", en: "Readers are paying more for slimmer products.", ref: "读者付费更多却获得缩水的内容。" },
    { num: "⑨", en: "Some papers even had the nerve to refuse delivery to distant suburbs.", ref: "一些报社甚至敢拒绝向边远郊区递送报纸。" },
    { num: "⑩", en: "Yet these desperate measures have proved the right ones and, sadly for many journalists, they can be pushed further.", ref: "不过，这些孤注一掷的举措证明是对的，只是不幸的是，对于许多新闻工作者来说，他们可能遭到进一步的裁员。" }
    ]
  },
  {
    day: 121,
    type: "英二",
    source: "2011 Text 2",
    zh: "随着来自读者和广告商的收益比例更加健康合理，报纸业日趋平衡。长期以来，美国报纸业对广告过度依赖。经济合作与发展组织（OECD）称，2008 年美国报纸业高达 87%的收益来自广告。（而）在日本这一比例为 35%。毫无疑问，日本报纸业要稳定得多。",
    sentences: [
    { num: "①", en: "Newspapers are becoming more balanced businesses, with a healthier mix of revenues from readers and advertisers.", ref: "随着来自读者和广告商的收益比例更加健康合理，报纸业日趋平衡。" },
    { num: "②", en: "American papers have long been highly unusual in their reliance on ads.", ref: "长期以来，美国报纸业对广告过度依赖。" },
    { num: "③", en: "Fully 87% of their revenues came from advertising in 2008, according to the Organization for Economic Cooperation & Development (OECD).", ref: "经济合作与发展组织（OECD）称，2008 年美国报纸业高达 87%的收益来自广告。" },
    { num: "④", en: "In Japan the proportion is 35%.", ref: "（而）在日本这一比例为 35%。" },
    { num: "⑤", en: "Not surprisingly, Japanese newspapers are much more stable.", ref: "毫无疑问，日本报纸业要稳定得多。" }
    ]
  },
  {
    day: 122,
    type: "英二",
    source: "2011 Text 2",
    zh: "这场席卷整个新闻编辑部的旋风伤及每个人，但大部分损失集中于报纸内容最缺乏特色的板块。汽车和电影评论员消失了。科学和大众商业记者也未能留下。驻外办事处遭到无情撤销。因此，现在报纸更加不完整。但如今，完整性已经不再是报纸业的优点了。",
    sentences: [
    { num: "①", en: "The whirlwind that swept through newsrooms harmed everybody, but much of the damage has been concentrated in areas where newspapers are least distinctive.", ref: "这场席卷整个新闻编辑部的旋风伤及每个人，但大部分损失集中于报纸内容最缺乏特色的板块。" },
    { num: "②", en: "Car and film reviewers have gone.", ref: "汽车和电影评论员消失了。" },
    { num: "③", en: "So have science and general business reporters.", ref: "科学和大众商业记者也未能留下。" },
    { num: "④", en: "Foreign bureaus have been savagely cut off.", ref: "驻外办事处遭到无情撤销。" },
    { num: "⑤", en: "Newspapers are less complete as a result.", ref: "因此，现在报纸更加不完整。" },
    { num: "⑥", en: "But completeness is no longer a virtue in the newspaper business.", ref: "但如今，完整性已经不再是报纸业的优点了。" }
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
    { num: "①", en: "We tend to think of the decades immediately following World War II as a time of prosperity and growth, with soldiers returning home by the millions, going off to college on the G. I. Bill and lining up at the marriage bureaus.", ref: "我们往往将二战结束后的几十年看作一个繁荣与增长的时代，数以百万计的士兵们返回家乡;他们在《退伍军人权利法案》的帮助下去上大学；在婚姻登记处排队登记结婚。" },
    { num: "②", en: "But when it came to their houses, it was a time of common sense and a belief that less could truly be more.", ref: "但是说到住宅，那却是一个“少真的可以是多”成为常识和信念的时代。" },
    { num: "③", en: "During the Depression and the war, Americans had learned to live with less, and that restraint, in combination with the postwar confidence in the future, made small, efficient housing positively stylish.", ref: "在大萧条和战争时期，美国人学会了节约生活，这种克制连同战后对未来生活的信心，使得小而高效的住宅成为绝对的时髦。" }
    ]
  },
  {
    day: 124,
    type: "英二",
    source: "2011 Text 3",
    zh: "经济状况只是这种高效生活方式的一个刺激因素。“少即是多”这句话实际上是首先由一位名叫路德维希·密斯·凡德罗的德国建筑家推广开来的，像其他与包豪斯建筑学院相关的设计师一样，他在二战之前移民到美国，并曾在美国多个建筑学院任职。这些设计师们来到美国，对美国建筑业的发展施加了巨大的影响，但是其中影响最大的，还是要数密斯。",
    sentences: [
    { num: "①", en: "Economic condition was only a stimulus for the trend toward efficient living.", ref: "经济状况只是这种高效生活方式的一个刺激因素。" },
    { num: "②", en: "The phrase “less is more” was actually first popularized by a German, the architect Ludwig Mies van der Rohe, who like other people associated with the Bauhaus, a school of design, emigrated to the United States before World War II and took up posts at American architecture schools.", ref: "“少即是多”这句话实际上是首先由一位名叫路德维希·密斯·凡德罗的德国建筑家推广开来的，像其他与包豪斯建筑学院相关的设计师一样，他在二战之前移民到美国，并曾在美国多个建筑学院任职。" },
    { num: "③", en: "These designers came to exert enormous influence on the course of American architecture, but none more so than Mies.", ref: "这些设计师们来到美国，对美国建筑业的发展施加了巨大的影响，但是其中影响最大的，还是要数密斯。" }
    ]
  },
  {
    day: 125,
    type: "英二",
    source: "2011 Text 3",
    zh: "密斯的口头禅意思是，简约的装饰，经过适当的安排，会产生比繁复的装饰更强的冲击力。他认为，优雅并非来自于繁多。和其他的现代建筑师一样，他使用金属、玻璃和复合板，这些我们今天习以为常的材料，在 20 世纪 40 年代却是一种对未来的象征。密斯使用的精致的呈现方式，掩盖了他所设计的空间实际上是小而精，而非大而空的事实。例如，密斯建在芝加哥湖滨大道上那些优雅塔楼中的公寓，跟它们坐落在芝加哥黄金海岸上的年代更久远的邻居相比，面积更小，只有两个卧室,面积不到 1000 平方英尺。但是它们很受欢迎，因为这些公寓有着通透的玻璃墙，可以观看优美风景，建筑细节优雅，比例和谐，这些都是当时风靡的抽象艺术在建筑上的对应物。",
    sentences: [
    { num: "①", en: "Mies’s signature phrase means that less decoration, properly organized, has more impact than a lot.", ref: "密斯的口头禅意思是，简约的装饰，经过适当的安排，会产生比繁复的装饰更强的冲击力。" },
    { num: "②", en: "Elegance, he believed, did not derive from abundance.", ref: "他认为，优雅并非来自于繁多。" },
    { num: "③", en: "Like other modern architects, he employed metal, glass and laminated wood — materials that we take for granted today but that in the 1940s symbolized the future.", ref: "和其他的现代建筑师一样，他使用金属、玻璃和复合板，这些我们今天习以为常的材料，在 20 世纪 40 年代却是一种对未来的象征。" },
    { num: "④", en: "Mies’s sophisticated presentation masked the fact that the spaces he designed were small and efficient, rather than big and often empty.", ref: "密斯使用的精致的呈现方式，掩盖了他所设计的空间实际上是小而精，而非大而空的事实。" },
    { num: "⑤", en: "The apartments in the elegant towers Mies built on Chicago’s Lake Shore Drive, for example, were smaller — two-bedroom units under 1,000 square feet — than those in their older neighbors along the city’s Gold Coast.", ref: "例如，密斯建在芝加哥湖滨大道上那些优雅塔楼中的公寓，跟它们坐落在芝加哥黄金海岸上的年代更久远的邻居相比，面积更小，只有两个卧室,面积不到 1000 平方英尺。" },
    { num: "⑥", en: "But they were popular because of their airy glass walls, the views they afforded and the elegance of the buildings’ details and proportions, the architectural equivalent of the abstract art so popular at the time.", ref: "但是它们很受欢迎，因为这些公寓有着通透的玻璃墙，可以观看优美风景，建筑细节优雅，比例和谐，这些都是当时风靡的抽象艺术在建筑上的对应物。" }
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
    { num: "①", en: "The trend toward “less” was not entirely foreign.", ref: "“简约”浪潮并不完全是舶来品。" },
    { num: "②", en: "In the 1930s Frank Lloyd Wright started building more modest and efficient houses — usually around 1,200 square feet — than the spreading two-story ones he had designed in the 1890s and the early 20th century.", ref: "20 世纪 30 年代，弗兰克·劳埃德·赖特开始建造不太大的、更为简洁的住宅，这些住宅通常面积在 1200 平方英尺，而不像他自己在 19 世纪 90 年代的和 20 世纪初设计的面积铺张的二层住宅。" },
    { num: "③", en: "The “Case Study Houses” commissioned from talented modern architects by California Arts & Architecture magazine between 1945 and 1962 were yet another homegrown influence on the “less is more” trend.", ref: "由加州《艺术与建筑》杂志委托有才华的现代建筑师，于 1945 到 1962 年间建造的“案例研究住宅”，更是另一股在美国本土成长起来的，对“少即是多”浪潮产生影响的力量。" },
    { num: "④", en: "Aesthetic effect came from the landscape, new materials and forthright detailing.", ref: "审美效果来自于自然风光、新的材料,以及直观明了的细节设计。" },
    { num: "⑤", en: "In his Case Study House, Ralph Rapson may have mispredicted just how the mechanical revolution would impact everyday life — few American families acquired helicopters, though most eventually got clothes dryers — but his belief that self-sufficiency was both desirable and inevitable was widely shared.", ref: "在罗夫·雷普森的案例研究住宅中,他可能错误预测了机械革命对日常生活可能产生的影响--尽管大多数美国家庭最终都拥有了干衣机，但很少有能拥有直升机的--但他认为自给自足既是可取的，也是必然的，这一信念却得到了广泛传播。" }
    ]
  },
  {
    day: 127,
    type: "英二",
    source: "2011 Text 4",
    zh: "欧盟还能成功走下去吗？如果不久前这么问:会让人觉得奇怪。可现在，即使是该项目（欧盟计划）最强有力的支持者都在议论整个大陆面临的百慕大三角”债务、人口下降以及增长趋缓。除了那些长期性问题以外，欧盟的经济核心区，即使用单一货币的 16 个成员国，还面临着一场严重的危机。市场已不再相信欧元区各经济体，无论强弱，会由于共用单一货币这一原则——让缺乏竞争力的成员国无法采取货币贬值这一权宜之计——而最终走向联合。",
    sentences: [
    { num: "①", en: "Will the European Union make it?", ref: "欧盟还能成功走下去吗？" },
    { num: "②", en: "The question would have sounded strange not long ago.", ref: "如果不久前这么问:会让人觉得奇怪。" },
    { num: "③", en: "Now even the project’s greatest cheerleaders talk of a continent facing a “Bermuda triangle” of debt, population decline and lower growth.", ref: "可现在，即使是该项目（欧盟计划）最强有力的支持者都在议论整个大陆面临的百慕大三角”债务、人口下降以及增长趋缓。" },
    { num: "④", en: "As well as those chronic problems, the EU faces an acute crisis in its economic core, the 16 countries that use the single currency.", ref: "除了那些长期性问题以外，欧盟的经济核心区，即使用单一货币的 16 个成员国，还面临着一场严重的危机。" },
    { num: "⑤", en: "Markets have lost faith that the euro zone’s economies, weaker or stronger, will one day converge thanks to the discipline of sharing a single currency, which denies uncompetitive members the quick fix of devaluation.", ref: "市场已不再相信欧元区各经济体，无论强弱，会由于共用单一货币这一原则——让缺乏竞争力的成员国无法采取货币贬值这一权宜之计——而最终走向联合。" }
    ]
  },
  {
    day: 128,
    type: "英二",
    source: "2011 Text 4",
    zh: "然而关于如何使欧洲单一货币免于解体的讨论陷入了僵局。陷入僵局的原因在于，欧元区两大主导国家，法国和德国，在“欧元区内部需要加强统一”上观点一致，但在“统一内容”上却存在分歧。德国认为若想拯救欧元，必须在借贷支出以及竞争力等方面制定更加严格的准则，同时对违规的政府施以准自动制裁。这些制裁可以包括威胁冻结欧盟对较贫困地区及欧盟巨型项目的投资，甚至包含暂停一国在欧盟部长理事会中的投票权。德国坚持认为经济协作应该包含欧盟俱乐部的所有 27 国成员，在它们当中，支持自由市场自由主义和从严的经济政策占微弱多数；（不过）单从内部核心来看，德国担心，微弱多数会支持法国的干涉。",
    sentences: [
    { num: "①", en: "Yet the debate about how to save Europe’s single currency from disintegration is stuck.", ref: "然而关于如何使欧洲单一货币免于解体的讨论陷入了僵局。" },
    { num: "②", en: "It is stuck because the euro zone’s dominant powers, France and Germany, agree on the need for greater harmonization within the euro zone, but disagree about what to harmonize.", ref: "陷入僵局的原因在于，欧元区两大主导国家，法国和德国，在“欧元区内部需要加强统一”上观点一致，但在“统一内容”上却存在分歧。" },
    { num: "③", en: "Germany thinks the euro must be saved by stricter rules on borrowing, spending and competitiveness, backed by quasi-automatic sanctions for governments that do not obey.", ref: "德国认为若想拯救欧元，必须在借贷支出以及竞争力等方面制定更加严格的准则，同时对违规的政府施以准自动制裁。" },
    { num: "④", en: "These might include threats to freeze EU funds for poorer regions and EU mega-projects, and even the suspension of a country’s voting rights in EU ministerial councils.", ref: "这些制裁可以包括威胁冻结欧盟对较贫困地区及欧盟巨型项目的投资，甚至包含暂停一国在欧盟部长理事会中的投票权。" },
    { num: "⑤", en: "It insists that economic co-ordination should involve all 27 members of the EU club, among whom there is a small majority for free-market liberalism and economic rigour; in the inner core alone, Germany fears, a small majority favor French interference.", ref: "德国坚持认为经济协作应该包含欧盟俱乐部的所有 27 国成员，在它们当中，支持自由市场自由主义和从严的经济政策占微弱多数；（不过）单从内部核心来看，德国担心，微弱多数会支持法国的干涉。" }
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
    { num: "①", en: "A “southern” camp headed by France wants something different: “European economic government” within an inner core of euro-zone members.", ref: "法国统领的“南部”阵营则另有所求：在欧元区成员国的内部核心成立一个“欧洲经济政府”。" },
    { num: "②", en: "Translated, that means politicians intervening in monetary policy and a system of redistribution from richer to poorer members, via cheaper borrowing for governments through common Eurobonds or complete fiscal transfers.", ref: "换种说法就是，通过“欧洲共同债券或完整的财政转移实现政府的低息借贷”这种形式，政客们对货币政策以及富裕成员国到贫困成员国的收入再分配体制实施干预。" },
    { num: "③", en: "Finally, figures close to the French government have murmured, euro-zone members should agree to some fiscal and social harmonization: e.g. , curbing competition in corporate-tax rates or labor costs.", ref: "最后，那些亲近法国政府的重要人士私下抱怨说，欧元区成员国应该就财政和社会的统一措施达成共识，比如抑制企业税率或劳动力成本方面的竞争。" }
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
    { num: "①", en: "It is too soon to write off the EU.", ref: "就这么宣判欧盟的死刑还为时过早。" },
    { num: "②", en: "It remains the world’s largest trading block.", ref: "它仍是世界最大的贸易组织。" },
    { num: "③", en: "At its best, the European project is remarkably liberal: built around a single market of 27 rich and poor countries, its internal borders are far more open to goods, capital and labour than any comparable trading area.", ref: "在最佳状况下，这一欧洲大工程（即欧盟计划）相当自由：建立在一个由 27 个贫富不一的国家所组成的单一市场之上其内部边界对商品、资金以及劳动力的开放程度比任何一个具有可比性的贸易区都高得多。" },
    { num: "④", en: "It is an ambitious attempt to blunt the sharpest edges of globalization, and make capitalism benign.", ref: "欧盟工程是一次雄心壮举：意在钝化全球化的尖锐棱角，让资本主义朝着良性发展。" }
    ]
  },
  {
    day: 131,
    type: "英二",
    source: "2012 Text 1",
    zh: "家庭作业从来就不曾得到学生甚至许多父母的真正欢迎，但近几年尤其饱受诟病。全国的学区，如最近的洛杉矶联合学区，都在修改他们有关此教育惯例的思路。不幸的是，洛杉矶联合学区制定了一项硬性规定，责令除某些高级课程之外，家庭作业在学生学业成绩中所占比例不得超过 10%。",
    sentences: [
    { num: "①", en: "Homework has never been terribly popular with students and even many parents, but in recent years it has been particularly scorned.", ref: "家庭作业从来就不曾得到学生甚至许多父母的真正欢迎，但近几年尤其饱受诟病。" },
    { num: "②", en: "School districts across the country, most recently Los Angeles Unified, are revising their thinking on his educational ritual.", ref: "全国的学区，如最近的洛杉矶联合学区，都在修改他们有关此教育惯例的思路。" },
    { num: "③", en: "Unfortunately, L. A. Unified has produced an inflexible policy which mandates that with the exception of some advanced courses, homework may no longer count for more than 10% of a student’s academic grade.", ref: "不幸的是，洛杉矶联合学区制定了一项硬性规定，责令除某些高级课程之外，家庭作业在学生学业成绩中所占比例不得超过 10%。" }
    ]
  },
  {
    day: 132,
    type: "英二",
    source: "2012 Text 1",
    zh: "此规定旨在解决贫困或混乱家庭学生在完成家庭作业方面可能存有的困难。但政策内容不明且自相矛盾。当然，不应给学生布置他们无法独立完成或者需要贵重设备才能完成的家庭作业。但如果学区本质上是在给那些因家庭复杂而不做作业的学生以通行证，则近于冒险暗示应降低对贫困孩子的标准。",
    sentences: [
    { num: "①", en: "This rule is meant to address the difficulty that students from impoverished or chaotic homes might have in completing their homework.", ref: "此规定旨在解决贫困或混乱家庭学生在完成家庭作业方面可能存有的困难。" },
    { num: "②", en: "But the policy is unclear and contradictory.", ref: "但政策内容不明且自相矛盾。" },
    { num: "③", en: "Certainly, no homework should be assigned that students cannot complete on their own or that they cannot do without expensive equipment.", ref: "当然，不应给学生布置他们无法独立完成或者需要贵重设备才能完成的家庭作业。" },
    { num: "④", en: "But if the district is essentially giving a pass to students who do not do their homework because of complicated family lives, it is going riskily close to the implication that standards need to be lowered for poor children.", ref: "但如果学区本质上是在给那些因家庭复杂而不做作业的学生以通行证，则近于冒险暗示应降低对贫困孩子的标准。" }
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
    { num: "①", en: "District administrators say that homework will still be a part of schooling: teachers are allowed to assign as much of it as they want.", ref: "学区管理者表示，家庭作业仍将是学校教育的一部分；教师可以自主安排作业量。" },
    { num: "②", en: "But with homework counting for no more than 10% of their grades, students can easily skip half their homework and see very little difference on their report cards.", ref: "但在家庭作业仅占学业成绩的 10% 的情形下，学生大可逃掉一半的作业而成绩单却几乎不会有变化。" },
    { num: "③", en: "Some students might do well on state tests without completing their homework, but what about the students who performed well on the tests and did their homework?", ref: "有些学生可能没做家庭作业也会在州考中表现良好，但那些做了家庭作业且在州考中表现良好的学生又该怎么解释呢？" },
    { num: "④", en: "It is quite possible that the homework helped.", ref: "很有可能家庭作业起到了助益作用。" },
    { num: "⑤", en: "Yet rather than empowering teachers to find what works best for their students, the policy imposes a flat, across-the-board rule.", ref: "然而该政策不是授权教师去探索什么样的方式最适合学生，而是强制颁布一项呆板的、一刀切的规定。" }
    ]
  },
  {
    day: 134,
    type: "英二",
    source: "2012 Text 1",
    zh: "与此同时，该政策并未解决任何关于家庭作业的真正棘手问题。如果学区发现家庭作业对学生的学业成绩影响不大，那么它应该减少甚至排除家庭作业，而不是让其在成绩中的比重变得微乎其微。相反，如果家庭作业确实重要，那就应该让其在成绩中占据重要比例。并且，这一政策并未采取任何措施确保学生的家庭作业对于他们的年龄和学科来说是有意义且合适的，也不能确保教师布置的作业量未超过他们愿意批改的量。有关家庭作业的规定应暂缓实施，而负责制定教育政策的校董事会应深入调查并举行公众听证会。洛杉矶联合学区要正确对待家庭作业，现在还为时不晚。",
    sentences: [
    { num: "①", en: "At the same time, the policy addresses none of the truly thorny questions about homework.", ref: "与此同时，该政策并未解决任何关于家庭作业的真正棘手问题。" },
    { num: "②", en: "If the district finds homework to be unimportant to its students’ academic achievement, it should move to reduce or eliminate the assignments, not make them count for almost nothing.", ref: "如果学区发现家庭作业对学生的学业成绩影响不大，那么它应该减少甚至排除家庭作业，而不是让其在成绩中的比重变得微乎其微。" },
    { num: "③", en: "Conversely, if homework matters, it should account for a significant portion of the grade.", ref: "相反，如果家庭作业确实重要，那就应该让其在成绩中占据重要比例。" },
    { num: "④", en: "Meanwhile, this policy does nothing to ensure that the homework students receive is meaningful or appropriate to their age and the subject, or that teachers are not assigning more than they are willing to review and correct.", ref: "并且，这一政策并未采取任何措施确保学生的家庭作业对于他们的年龄和学科来说是有意义且合适的，也不能确保教师布置的作业量未超过他们愿意批改的量。" },
    { num: "⑤", en: "The homework rules should be put on hold while the school board, which is responsible for setting educational policy, looks into the matter and conducts public hearings.", ref: "有关家庭作业的规定应暂缓实施，而负责制定教育政策的校董事会应深入调查并举行公众听证会。" },
    { num: "⑥", en: "It is not too late for L.A. Unified to do homework right.", ref: "洛杉矶联合学区要正确对待家庭作业，现在还为时不晚。" }
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
    zh: "穿粉色好看：成年女性不记得自己曾如此痴迷这种颜色，然而它却充斥着我们年轻女孩的生活。并不是粉色本身不好，而是它只是七色彩虹中那么一丝而已。虽说粉色在某种程度上能为少女时代添色，但它也一而再地，强有力地将女孩特质与其外表相熔合此后，粉色就呈现出女孩间，甚至两岁女孩间的共性：纯真，而且粉色也被当成了女孩纯真的证明。环顾四周，我绝望地发现，人们对女孩生活和兴趣的想象是如此地贫乏。",
    sentences: [
    { num: "①", en: "Pretty in pink: adult women do not remember being so obsessed with the color, yet it is pervasive in our young girls’ lives.", ref: "穿粉色好看：成年女性不记得自己曾如此痴迷这种颜色，然而它却充斥着我们年轻女孩的生活。" },
    { num: "②", en: "It is not that pink is intrinsically bad, but it is such a tiny slice of the rainbow and, though it may celebrate girlhood in one way, it also repeatedly and firmly fuses girls’ identity to appearance.", ref: "并不是粉色本身不好，而是它只是七色彩虹中那么一丝而已。" },
    { num: "③", en: "Then it presents that connection, even among two-year-olds, between girls as not only innocent but as evidence of innocence.", ref: "虽说粉色在某种程度上能为少女时代添色，但它也一而再地，强有力地将女孩特质与其外表相熔合此后，粉色就呈现出女孩间，甚至两岁女孩间的共性：纯真，而且粉色也被当成了女孩纯真的证明。" },
    { num: "④", en: "Looking around, I despaired at the singular lack of imagination about girls’ lives and interests.", ref: "环顾四周，我绝望地发现，人们对女孩生活和兴趣的想象是如此地贫乏。" }
    ]
  },
  {
    day: 136,
    type: "英二",
    source: "2012 Text 2",
    zh: "女孩对粉色的青睐看起来似乎是无法避免的，似乎在某种程度上被编码进了她们的 DNA。不过，根据美国研究副教授乔帕雷提的说法，情况不是这样的。20 世纪初以前，儿童根本没有颜色编码：在家用洗衣机问世之前的年代里，出于实用角度，所有婴儿都穿白色衣服，因为将衣服洗干净的唯一方法是将衣服煮沸。而且，男孩、女孩都穿着被认为是中性的衣服。当育儿颜色引入之时，粉色实际上被认为是更具男性特征的颜色，是红色的清淡柔和版，与力量相关。而蓝色象征着女性特征，令人联想到圣母玛利亚，代表着坚贞与忠诚。直到 20世纪 80 年代中期，随着强化年龄和性别差异成为儿童市场主要营销策略时，粉色才盛行起来，开始对女孩产生一种看似固有的吸引力，这让粉色成为定义女性特质的一部分至少在最初关键的几年里是如此。",
    sentences: [
    { num: "①", en: "Girls’ attraction to pink may seem unavoidable, somehow encoded in their DNA, but according to Jo Paoletti, an associate professor of American Studies, it is not.", ref: "女孩对粉色的青睐看起来似乎是无法避免的，似乎在某种程度上被编码进了她们的 DNA。不过，根据美国研究副教授乔帕雷提的说法，情况不是这样的。" },
    { num: "②", en: "Children were not color-coded at all until the early 20th century: in the era before domestic washing machines all babies wore white as a practical matter, since the only way of getting clothes clean was to boil them.", ref: "20 世纪初以前，儿童根本没有颜色编码：在家用洗衣机问世之前的年代里，出于实用角度，所有婴儿都穿白色衣服，因为将衣服洗干净的唯一方法是将衣服煮沸。" },
    { num: "③", en: "What's more, both boys and girls wore what were thought of as gender-neutral dresses.", ref: "而且，男孩、女孩都穿着被认为是中性的衣服。" },
    { num: "④", en: "When nursery colors were introduced, pink was actually considered the more masculine color, a pastel version of red, which was associated with strength.", ref: "当育儿颜色引入之时，粉色实际上被认为是更具男性特征的颜色，是红色的清淡柔和版，与力量相关。" },
    { num: "⑤", en: "Blue, with its intimations of the Virgin Mary, constancy and faithfulness, symbolized femininity.", ref: "而蓝色象征着女性特征，令人联想到圣母玛利亚，代表着坚贞与忠诚。" },
    { num: "⑥", en: "It was not until the mid-1980s, when amplifying age and sex differences became a dominant children’s marketing strategy, that pink fully came into its own, when it began to seem inherently attractive to girls, part of what defined them as female, at least for the first few critical years.", ref: "直到 20世纪 80 年代中期，随着强化年龄和性别差异成为儿童市场主要营销策略时，粉色才盛行起来，开始对女孩产生一种看似固有的吸引力，这让粉色成为定义女性特质的一部分至少在最初关键的几年里是如此。" }
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
    { num: "①", en: "I had not realized how profoundly marketing trends dictated our perception of what is natural to kids, including our core beliefs about their psychological development.", ref: "我之前并没有意识到，我们对儿童天性的看法深受市场营销趋势的支配，包括我们对他们心理发展的核心观念。" },
    { num: "②", en: "Take the toddler. I assumed that phase was something experts developed after years of research into children's behavior: wrong.", ref: "以学步的儿童为例，我曾以为这个阶段只是专家对儿童行为的多年研究之后界定的结果：但是我错了。" },
    { num: "③", en: "Turns out, according to Daniel Cook, a historian of childhood consumerism, it was popularized as a marketing trick by clothing manufacturers in the 1930s.", ref: "根据研究儿童消费主义的历史学家丹尼尔·库克的说法，它实际上是 20 世纪 30 年代被服装制造商作为一种营销技巧而得以普及。" }
    ]
  },
  {
    day: 138,
    type: "英二",
    source: "2012 Text 2",
    zh: "贸易出版物建议百货商店：要增加销量就应该在婴儿服装和稍大一些孩子的服装之间创建“第三跳板”。直到“蹒跚学步儿童”变成一个常见购物者用语之后，这一“第三跳板”才演变为人们普遍认可的儿童发展阶段。将儿童或者成年人细分为更小的类别已经被证实一定能使商家增加利润。而对市场进行细分的一个最简单办法就是放大性别差异——或者当性别差异并非明显存在时创造出性别差异。",
    sentences: [
    { num: "①", en: "Trade publications counseled department stores that, in order to increase sales, they should create a “third stepping stone” between infant wear and older kids’ clothes.", ref: "贸易出版物建议百货商店：要增加销量就应该在婴儿服装和稍大一些孩子的服装之间创建“第三跳板”。" },
    { num: "②", en: "It was only after “toddler” became a common shopper’ term that it evolved into a broadly accepted developmental stage.", ref: "直到“蹒跚学步儿童”变成一个常见购物者用语之后，这一“第三跳板”才演变为人们普遍认可的儿童发展阶段。" },
    { num: "③", en: "Splitting kids, or adults, into ever-tinier categories has proved a sure-fire way to boost profits.", ref: "将儿童或者成年人细分为更小的类别已经被证实一定能使商家增加利润。" },
    { num: "④", en: "And one of the easiest ways to segment a market is to magnify gender differences—or invent them where they did not previously exist.", ref: "而对市场进行细分的一个最简单办法就是放大性别差异——或者当性别差异并非明显存在时创造出性别差异。" }
    ]
  },
  {
    day: 139,
    type: "英二",
    source: "2012 Text 3",
    zh: "2010 年，一位联邦法官彻底震惊了美国生物技术行业。此前数十年，公司们一直在享有分离 DNA 的专利——截止到 2005 年，约 20%的人类基因已被申请专利。但在 2010 年 3 月，一位法官做出裁决：基因不可申请专利。这让（生物技术公司）主管们发狂般地焦躁不安。作为贸易团体，生物技术工业组织（BIO）向其成员承诺，这只是一场长期战争的“第一步”。7 月 29 日，他们如释重负，至少暂时如此。联邦上诉法院推翻了先前判决，裁决 MyriadGenetics 公司的确可以拥有两项帮助预测女性乳腺癌风险的基因专利。位于犹他州的Myriad 公司的执行总裁认为，这一裁决无论对于公司还是对于病人都是一种福音。",
    sentences: [
    { num: "①", en: "In 2010, a federal judge shook America’s biotech industry to the core.", ref: "2010 年，一位联邦法官彻底震惊了美国生物技术行业。" },
    { num: "②", en: "Companies had won patents for isolated DNA for decades—by 2005 some 20% of human genes were patented.", ref: "此前数十年，公司们一直在享有分离 DNA 的专利——截止到 2005 年，约 20%的人类基因已被申请专利。" },
    { num: "③", en: "But in March 2010 a judge ruled that genes were unpatentable.", ref: "但在 2010 年 3 月，一位法官做出裁决：基因不可申请专利。" },
    { num: "④", en: "Executives were violently agitated.", ref: "这让（生物技术公司）主管们发狂般地焦躁不安。" },
    { num: "⑤", en: "The Biotechnology Industry Organization (BIO), a trade group, assured members that this was just a “preliminary step” in a longer battle.", ref: "作为贸易团体，生物技术工业组织（BIO）向其成员承诺，这只是一场长期战争的“第一步”。" },
    { num: "⑥", en: "On July 29th they were relieved, at least temporarily.", ref: "7 月 29 日，他们如释重负，至少暂时如此。" },
    { num: "⑦", en: "A federal appeals court overturned the prior decision, ruling that Myriad Genetics could indeed hold patents to two genes that help forecast a woman’s risk of breast cancer.", ref: "联邦上诉法院推翻了先前判决，裁决 MyriadGenetics 公司的确可以拥有两项帮助预测女性乳腺癌风险的基因专利。" },
    { num: "⑧", en: "The chief executive of Myriad, a company in Utah, said the ruling was a blessing to firms and patients alike.", ref: "位于犹他州的Myriad 公司的执行总裁认为，这一裁决无论对于公司还是对于病人都是一种福音。" }
    ]
  },
  {
    day: 140,
    type: "英二",
    source: "2012 Text 3",
    zh: "但随着公司继续对个性化医疗进行尝试，未来法庭仍然会相当忙碌。Myriad 案本身可能并未完结。批评者主要提出了三条反对基因专利的理由：基因是自然的产物，所以不可申请专利；基因专利抑制了创新而非奖励创新；专利垄断限制了人们对基因测试的使用，如对Myriad 基因测试的使用。似乎越来越多的人们趋于认同上述观点。去年，联邦专项小组敦促对基因检测方面的专利进行改革。十月，司法部针对 Myriad 案提交的案情摘要中提出，分离的 DNA 分子“就像从棉花籽中分离出的棉纤维一样，仅仅是自然的产物”。尽管上诉法庭已经做出了裁决，但重大问题依然悬而未决。例如，对一个完整基因组进行排序是否会侵犯其内部单个基因所获得的专利，这一问题尚不明朗。这一案件可能会上诉至最高法院。",
    sentences: [
    { num: "①", en: "But as companies continue their attempts at personalized medicine, the courts will remain rather busy.", ref: "但随着公司继续对个性化医疗进行尝试，未来法庭仍然会相当忙碌。" },
    { num: "②", en: "The Myriad case itself is probably not over.", ref: "Myriad 案本身可能并未完结。" },
    { num: "③", en: "Critics make three main arguments against gene patents: a gene is a product of nature, so it may not be patented; gene patents suppress innovation rather than reward it; and patents’ monopolies restrict access to genetic tests such as Myriad’s.", ref: "批评者主要提出了三条反对基因专利的理由：基因是自然的产物，所以不可申请专利；基因专利抑制了创新而非奖励创新；专利垄断限制了人们对基因测试的使用，如对Myriad 基因测试的使用。" },
    { num: "④", en: "A growing number seem to agree.", ref: "似乎越来越多的人们趋于认同上述观点。" },
    { num: "⑤", en: "Last year a federal task-force urged reform for patents related to genetic tests.", ref: "去年，联邦专项小组敦促对基因检测方面的专利进行改革。" },
    { num: "⑥", en: "In October the Department of Justice filed a brief in the Myriad case, arguing that an isolated DNA molecule “is no less a product of nature... than are cotton fibres that have been separated from cotton seeds. ”", ref: "十月，司法部针对 Myriad 案提交的案情摘要中提出，分离的 DNA 分子“就像从棉花籽中分离出的棉纤维一样，仅仅是自然的产物”。" },
    { num: "⑦", en: "Despite the appeals court’s decision, big questions remain unanswered.", ref: "尽管上诉法庭已经做出了裁决，但重大问题依然悬而未决。" },
    { num: "⑧", en: "For example, it is unclear whether the sequencing of a whole genome violates the patents of individual genes within it.", ref: "例如，对一个完整基因组进行排序是否会侵犯其内部单个基因所获得的专利，这一问题尚不明朗。" },
    { num: "⑨", en: "The case may yet reach the Supreme Court.", ref: "这一案件可能会上诉至最高法院。" }
    ]
  },
  {
    day: 141,
    type: "英二",
    source: "2012 Text 3",
    zh: "然而，随着这一行业的发展，其他诉讼可能会产生更大影响。公司已不大可能就“人类 DNA分子”申请许多专利——大多数该类基因早已被申请专利，或是属于公共领域。各企业当前正在研究基因间如何相互作用，以寻找可能用于确定疾病诱因或预测药物疗效的关联物。来自 BIO 的律师 HansSauer 解释道，各企业正急于获取“连点”专利。他们能否成功可能取决于一起由 Mayo 诊所引发的相关案件，最高法院将于下一庭审期对这一案件进行听审。BIO 最近召开大会，开展一系列会议针对目前变换的专利情形对律师进行培训。每一场会议都座无虚席。",
    sentences: [
    { num: "①", en: "As the industry advances, however, other suits may have an even greater impact.", ref: "然而，随着这一行业的发展，其他诉讼可能会产生更大影响。" },
    { num: "②", en: "Companies are unlikely to file many more patents for human DNA molecules—most are already patented or in the public domain.", ref: "公司已不大可能就“人类 DNA分子”申请许多专利——大多数该类基因早已被申请专利，或是属于公共领域。" },
    { num: "③", en: "Firms are now studying how genes interact, looking for correlations that might be used to determine the causes of disease or predict a drug’s efficacy.", ref: "各企业当前正在研究基因间如何相互作用，以寻找可能用于确定疾病诱因或预测药物疗效的关联物。" },
    { num: "④", en: "Companies are eager to win patents for “connecting the dots”, explains Hans Sauer, a lawyer for the BIO.", ref: "来自 BIO 的律师 HansSauer 解释道，各企业正急于获取“连点”专利。" },
    { num: "⑤", en: "Their success may be determined by a suit related to this issue, brought by the Mayo Clinic, which the Supreme Court will hear in its next term.", ref: "他们能否成功可能取决于一起由 Mayo 诊所引发的相关案件，最高法院将于下一庭审期对这一案件进行听审。" },
    { num: "⑥", en: "The BIO recently held a convention which included sessions to coach lawyers on the shifting landscape for patents.", ref: "BIO 最近召开大会，开展一系列会议针对目前变换的专利情形对律师进行培训。" },
    { num: "⑦", en: "Each meeting was packed.", ref: "每一场会议都座无虚席。" }
    ]
  },
  {
    day: 142,
    type: "英二",
    source: "2012 Text 4",
    zh: "大衰退也许结束了，但高失业率时代很有可能才刚刚开始。在它结束之前，它将很可能改变年轻一代的生活轨迹及其性格。而且它最终可能会在未来许多年重塑我们的政治、文化以及社会特征。在这场全国性的经济灾难中，没有人比失业者更努力地在寻找一线希望。许多人说，尽管失业极其痛苦，但是它以某些方式使人进步；自己变得不再那么贪图物质享乐，而且在经济问题上更加审慎；自己比过去更能体会到别人的艰辛。在有限的几个方面，也许大萧条将使得整个社会变得更好。至少它将我们从“一夜暴富和豪宅”的民族热梦中唤醒，并且给挥金如土的个人消费时代画上了一个必要的句号。",
    sentences: [
    { num: "①", en: "The great recession may be over, but this era of high joblessness is probably beginning.", ref: "大衰退也许结束了，但高失业率时代很有可能才刚刚开始。" },
    { num: "②", en: "Before it ends, it will likely change the life course and character of a generation of young adults.", ref: "在它结束之前，它将很可能改变年轻一代的生活轨迹及其性格。" },
    { num: "③", en: "And ultimately, it is likely to reshape our politics, our culture, and the character of our society for years.", ref: "而且它最终可能会在未来许多年重塑我们的政治、文化以及社会特征。" },
    { num: "④", en: "No one tries harder than the jobless to find silver linings in this national economic disaster.", ref: "在这场全国性的经济灾难中，没有人比失业者更努力地在寻找一线希望。" },
    { num: "⑤", en: "Many said that unemployment, while extremely painful, had improved them in some ways: they had become less materialistic and more financially prudent; they were more aware of the struggles of others.", ref: "许多人说，尽管失业极其痛苦，但是它以某些方式使人进步；自己变得不再那么贪图物质享乐，而且在经济问题上更加审慎；自己比过去更能体会到别人的艰辛。" },
    { num: "⑥", en: "In limited respects, perhaps the recession will leave society better off.", ref: "在有限的几个方面，也许大萧条将使得整个社会变得更好。" },
    { num: "⑦", en: "At the very least, it has awoken us from our national fever dream of easy riches and bigger houses, and put a necessary end to an era of reckless personal spending.", ref: "至少它将我们从“一夜暴富和豪宅”的民族热梦中唤醒，并且给挥金如土的个人消费时代画上了一个必要的句号。" }
    ]
  },
  {
    day: 143,
    type: "英二",
    source: "2012 Text 4",
    zh: "然而对于大多数情况而言，这些好处似乎是微乎其微、未知且遥远的。在《经济增长的道德影响》一书中，经济历史学家本杰明·弗里德曼认为，美国国内外所经历的长期经济停滞或衰退几乎总是使社会变得更为狭隘、包容性更弱，而且往往使权利与自由的发展止步不前或逆向而行。反移民情绪往往会加剧，正如种族和阶级间矛盾一样。",
    sentences: [
    { num: "①", en: "But for the most part, these benefits seem thin, uncertain, and far off.", ref: "然而对于大多数情况而言，这些好处似乎是微乎其微、未知且遥远的。" },
    { num: "②", en: "In The Moral Consequences of Economic Growth, the economic historian Benjamin Friedman argues that both inside and outside the U.S., lengthy periods of economic stagnation or decline have almost always left society more mean-spirited and less inclusive, and have usually stopped or reversed the advance of rights and freedoms.", ref: "在《经济增长的道德影响》一书中，经济历史学家本杰明·弗里德曼认为，美国国内外所经历的长期经济停滞或衰退几乎总是使社会变得更为狭隘、包容性更弱，而且往往使权利与自由的发展止步不前或逆向而行。" },
    { num: "③", en: "Anti-immigrant sentiment typically increases, as does conflict between races and classes.", ref: "反移民情绪往往会加剧，正如种族和阶级间矛盾一样。" }
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
    zh: "经济衰退时期的收入差距往往会有所缩小，但这一次例外。的确，此次经济疲软阶段可能加深阶级隔阂，减少阶级隔阂弥合的机会——对于年轻人来说更是如此。哥伦比亚大学经济学家蒂尔。冯·瓦赫特在报告中指出，不是所有坠入衰退时期的人都认为人生机会渺茫：那些毕业于名牌大学的人会相当快地到达其繁荣时期毕业时本该置身其中的位置，落后的是那些不如他们的普通大众。",
    sentences: [
    { num: "①", en: "Income inequality usually falls during a recession, but it has not shrunk in this one.", ref: "经济衰退时期的收入差距往往会有所缩小，但这一次例外。" },
    { num: "②", en: "Indeed, this period of economic weakness may reinforce class divides, and decrease opportunities to cross them — especially for young people.", ref: "的确，此次经济疲软阶段可能加深阶级隔阂，减少阶级隔阂弥合的机会——对于年轻人来说更是如此。" },
    { num: "③", en: "The research of Till Von Wachter, the economist at Columbia University, suggests that not all people graduating into a recession see their life chances dimmed: those with degrees from elite universities catch up fairly quickly to where they otherwise would have been if they had graduated in better times;", ref: "哥伦比亚大学经济学家蒂尔。" },
    { num: "④", en: "it is the masses beneath them that are left behind.", ref: "冯·瓦赫特在报告中指出，不是所有坠入衰退时期的人都认为人生机会渺茫：那些毕业于名牌大学的人会相当快地到达其繁荣时期毕业时本该置身其中的位置，落后的是那些不如他们的普通大众。" }
    ]
  },
  {
    day: 145,
    type: "英二",
    source: "2012 Text 4",
    zh: "因特网时代，了解深藏于美国社会内部的怨气格外容易。当前难的是去弄清楚这些艰苦岁月究竟如何影响社会特征。在许多方面，步入经济萧条期的美国在社会问题上比历史上任何时期都更为宽容，而且从萧条开始时期，各种关于社会矛盾方面的全国性民意调查就显示出不同的结果。这些艰苦日子到底将如何重塑我们的社会结构，我们只能继续观望。但可以确定的是，它们一定会使社会结构得到重组，而且不利时期持续越久，重组的程度就越甚。",
    sentences: [
    { num: "①", en: "In the Internet age, it is particularly easy to see the resentment that has always been hidden within American society.", ref: "因特网时代，了解深藏于美国社会内部的怨气格外容易。" },
    { num: "②", en: "More difficult, in the moment, is discerning precisely how these lean times are affecting society’s character.", ref: "当前难的是去弄清楚这些艰苦岁月究竟如何影响社会特征。" },
    { num: "③", en: "In many respects, the U.S. was more socially tolerant entering this recession than at any time in its history, and a variety of national polls on social conflict since then have shown mixed results.", ref: "在许多方面，步入经济萧条期的美国在社会问题上比历史上任何时期都更为宽容，而且从萧条开始时期，各种关于社会矛盾方面的全国性民意调查就显示出不同的结果。" },
    { num: "④", en: "We will have to wait and see exactly how these hard times will reshape our social fabric.", ref: "这些艰苦日子到底将如何重塑我们的社会结构，我们只能继续观望。" },
    { num: "⑤", en: "But they certainly will reshape it, and all the more so the longer they extend.", ref: "但可以确定的是，它们一定会使社会结构得到重组，而且不利时期持续越久，重组的程度就越甚。" }
    ]
  },
  {
    day: 146,
    type: "英二",
    source: "2013 Text 1",
    zh: "《在美国制造》一文中，作者亚当·戴维森讲述了一个来自棉花产地、有关现代纺织厂自动化到达何种程度的笑话：普通纺织厂如今只有两名员工，“一个人和一只狗。人负责喂狗，而狗负责让人远离机器”戴维森此文只不过是新近涌现的诸多同类文章中的一篇，这些文章都提出这样一种观点：当前失业率居高不下以及中产阶级收入缩水，很大程度上是由于大萧条造成的需求大幅降低，但同时也由于全球化和信息技术革命的发展，这种发展使机器或外来雇工取代劳力的速度超过了以往任何时期。",
    sentences: [
    { num: "①", en: "In an essay entitled “Making It in America,” the author Adam Davidson relates a joke from cotton country about just how much a modern textile mill has been automated: The average mill has only two employees today, “a man and a dog.", ref: "《在美国制造》一文中，作者亚当·戴维森讲述了一个来自棉花产地、有关现代纺织厂自动化到达何种程度的笑话：普通纺织厂如今只有两名员工，“一个人和一只狗。" },
    { num: "②", en: "The man is there to feed the dog, and the dog is there to keep the man away from the machines.”", ref: "人负责喂狗，而狗负责让人远离机器。”" },
    { num: "③", en: "Davidson’s article is one of a number of pieces that have recently appeared making the point that the reason we have such stubbornly high unemployment and declining middle-class incomes today is largely because of the big drop in demand because of the Great Recession, but it is also because of the advances in both globalization and the information technology revolution, which are more rapidly than ever replacing labor with machines or foreign workers.", ref: "戴维森此文只不过是新近涌现的诸多同类文章中的一篇，这些文章都提出这样一种观点：当前失业率居高不下以及中产阶级收入缩水，很大程度上是由于大萧条造成的需求大幅降低，但同时也由于全球化和信息技术革命的发展，这种发展使机器或外来雇工取代劳力的速度超过了以往任何时期。" }
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
    { num: "①", en: "In the past, workers with average skills, doing an average job, could earn an average lifestyle.", ref: "过去，劳动者拥有一般技能，干一份普通工作，就能过上普通生活。" },
    { num: "②", en: "But, today, average is officially over.", ref: "但是现在，“平庸已正式结束。" },
    { num: "③", en: "Being average just won’t earn you what it used to.", ref: "表现平平完全无法再让你过上普通生活了。" },
    { num: "④", en: "It can’t when so many more employers have so much more access to so much more above average cheap foreign labor, cheap robotics, cheap software, cheap automation and cheap genius.", ref: "当如此多得多的雇主有着如此多得多的渠道获取如此多得多中等以上水平的廉价外国劳力、廉价机器人、廉价软件、廉价自动装置以及廉价天才的时候，表现普通将难以立足。" },
    { num: "⑤", en: "Therefore, everyone needs to find their extra — their unique value contribution that makes them stand out in whatever is their field of employment.", ref: "因此，所有人都需要找到自身的额外价值——一种可以令其在各种工作领域中脱颖而出的独特价值贡献。" },
    { num: "⑥", en: "Yes, new technology has been eating jobs forever, and always will.", ref: "的确，新技术一直在吞噬工作岗位，而且将永远持续下去。" },
    { num: "⑦", en: "But there’s been an acceleration.", ref: "不过速度一直在加快。" },
    { num: "⑧", en: "As Davidson notes, “In the 10 years ending in 2009, [U.S.] factories shed workers so fast that they erased almost all the gains of the previous 70 years; roughly one out of every three manufacturing jobs—about 6 million in total—disappeared.”", ref: "正如戴维森所言，“2009 年以前的十年间，（美国）工厂裁员如此之快，以至于抹掉了前 70 年所有新增员工的总额；制造业岗位中，大约有三分之一，共计将近 600 万个岗位不复存在。”" }
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
    zh: "变化将会永远存在——肃新岗位，新产品，新服务。但有一点我们确信无疑，随着全球化和信息技术革命的发展，最佳岗位将要求员工掌握更多更好的教育以使自己超越平庸。在一个已正式告别平庸的世界里，我们需要做很多事情以扶持就业，但对 21 世纪来讲，最重要的事情莫过于出台《美国退伍军人权利法案》之类的法案，以确保每个美国人都有机会接受高中后教育。",
    sentences: [
    { num: "①", en: "There will always be change — new jobs, new products, new services.", ref: "变化将会永远存在——肃新岗位，新产品，新服务。" },
    { num: "②", en: "But the one thing we know for sure is that with each advance in globalization and the I. T. revolution, the best jobs will require workers to have more and better education to make themselves above average.", ref: "但有一点我们确信无疑，随着全球化和信息技术革命的发展，最佳岗位将要求员工掌握更多更好的教育以使自己超越平庸。" },
    { num: "③", en: "In a world where average is officially over, there are many things we need to do to support employment, but nothing would be more important than passing some kind of G. I. Bill for the 21st century that ensures that every American has access to post-high school education.", ref: "在一个已正式告别平庸的世界里，我们需要做很多事情以扶持就业，但对 21 世纪来讲，最重要的事情莫过于出台《美国退伍军人权利法案》之类的法案，以确保每个美国人都有机会接受高中后教育。" }
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
    zh: "一个世纪前，横跨大西洋来到美国的移民中既有定居者，也有旅居客。许多人希望在美国建立永久家园，但也有人无意长留于此，打算赚些钱后便回返家乡 1908 到 1915 年间，约有700 万人抵达美国，而离开的大约有 200 万人。例如，约有四分之一的意大利移民最终永久返回了意大利。他们甚至有个亲切的昵称 uccelli di passaggio，“候鸟”。",
    sentences: [
    { num: "①", en: "A century ago, the immigrants from across the Atlantic included settlers and sojourners.", ref: "一个世纪前，横跨大西洋来到美国的移民中既有定居者，也有旅居客。" },
    { num: "②", en: "Along with the many folks looking to make a permanent home in the United States came those who had no intention to stay, and those who would make some money and then go home.", ref: "许多人希望在美国建立永久家园，但也有人无意长留于此，打算赚些钱后便回返家乡。" },
    { num: "③", en: "Between 1908 and 1915, about 7 million people arrived while about 2 million departed.", ref: "1908 到 1915 年间，约有700 万人抵达美国，而离开的大约有 200 万人。" },
    { num: "④", en: "About a quarter of all Italian immigrants, for example, eventually returned to Italy for good.", ref: "例如，约有四分之一的意大利移民最终永久返回了意大利。" },
    { num: "⑤", en: "They even had an affectionate nickname, “uccelli di passaggio”, birds of passage.", ref: "他们甚至有个亲切的昵称 uccelli di passaggio，“候鸟”。" }
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
    { num: "①", en: "Today, we are much more rigid about immigrants.", ref: "今天，我们对移民严格了许多。" },
    { num: "②", en: "We divide newcomers into two categories: legal or illegal, good or bad.", ref: "我们将新来者分为两类：合法或非法，好或坏。" },
    { num: "③", en: "We hail them as Americans in the making, or brand them as aliens to be kicked out.", ref: "我们或将其誉为“缔造中的美国人”，或将其归于“需要驱逐的异族”。" },
    { num: "④", en: "That framework has contributed mightily to our broken immigration system and the long political paralysis over how to fix it.", ref: "这一思维构架在很大程度上导致了我们的移民体系漏洞百出，也致使政府对“如何修复这一体系”处于长期瘫痪状态。" },
    { num: "⑤", en: "We don’t need more categories, but we need to change the way we think about categories.", ref: "我们无需更多类别，但需要改变对类别的思考方式。" },
    { num: "⑥", en: "We need to look beyond strict definitions of legal and illegal.", ref: "我们需要超越对“合法”和“非法”的严格定义。" },
    { num: "⑦", en: "To start, we can recognize the new birds of passage, those living and thriving in the gray areas.", ref: "首先，我们可以认可那些“新候鸟”，那些于灰色地带生活并繁荣发展的人。" },
    { num: "⑧", en: "We might then begin to solve our immigration challenges.", ref: "之后，我们才有可能着手解决在移民方面面临的挑战。" }
    ]
  }
];
