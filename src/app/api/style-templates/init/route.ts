import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// 农产品专属风格模板数据
const AGRICULTURAL_PRODUCT_TEMPLATES = [
  {
    name: "亲民朴实型",
    description: "适合农产品直播，强调真诚、实在、接地气的表达方式。像邻家大姐/大哥一样亲切自然。",
    style_type: "亲民型",
    tone_guidelines: "语气亲切自然，像和邻居聊天一样。多用'咱们'、'大伙儿'、'实在'等接地气的词汇。说话节奏舒缓，不急不躁。强调产品的真实、可靠，不做作。",
    opening_rules: JSON.stringify({
      patterns: [
        "打招呼+自我介绍+今天带来什么好东西",
        "直接切入产品+为什么今天要推荐",
        "问候老粉丝+介绍新朋友+预告今天福利"
      ],
      tips: "开场不要太正式，像朋友聊天一样自然"
    }),
    selling_rules: JSON.stringify({
      patterns: [
        "产品特点+实际体验+真诚推荐",
        "对比品质+价格优势+适用场景",
        "产地故事+品质保证+实惠价格"
      ],
      keywords: ["正宗", "新鲜", "实惠", "地道", "自家", "源头"],
      tips: "用具体细节打动人，比如口感、颜色、香味"
    }),
    promotion_rules: JSON.stringify({
      patterns: [
        "限时福利+数量有限+先到先得",
        "今天特价+平时价格+现在下单",
        "粉丝专享+专属优惠+感谢支持"
      ],
      tips: "强调实在的优惠，不要过度夸张"
    }),
    closing_rules: JSON.stringify({
      patterns: [
        "总结卖点+再次强调优惠+下单指引",
        "感谢支持+关注店铺+明天再见",
        "最后名额+错过可惜+赶紧下单"
      ],
      tips: "结尾真诚，给用户足够的下单时间"
    }),
    example_scripts: JSON.stringify([
      {
        scene: "开场白",
        script: "各位老铁下午好啊！今天给大家带来咱们家乡正宗的五香牛蹄筋，这个是我自个儿吃过觉得特别好，才敢推荐给大家的。"
      },
      {
        scene: "产品介绍",
        script: "你们看这个牛蹄筋，都是当天现做的，软糯Q弹，越嚼越香。不像外面那种嚼不动的，咱们这个是真材实料。"
      },
      {
        scene: "逼单",
        script: "今天这个价格真的太实惠了，平时在店里卖都要贵一半。直播间老铁们有福了，想尝鲜的赶紧下单啊！"
      }
    ])
  },
  {
    name: "激情促销型",
    description: "高能量、快节奏的直播风格，适合限时秒杀、爆款推广。强调紧迫感和兴奋感。",
    style_type: "促销型",
    tone_guidelines: "语速较快，声音洪亮，情绪饱满。多用感叹号、短句。强调'限时'、'秒杀'、'爆款'等紧迫词汇。节奏感强，经常提醒观众注意时间和数量。",
    opening_rules: JSON.stringify({
      patterns: [
        "震撼开场+今天福利+倒计时预告",
        "大爆款来袭+限时秒杀+准备好了吗",
        "家人们注意啦+超级福利+马上开始"
      ],
      tips: "开场要有冲击力，快速抓住注意力"
    }),
    selling_rules: JSON.stringify({
      patterns: [
        "爆款理由+疯狂价格+错过后悔",
        "品质保证+超值优惠+限时抢购",
        "销量见证+口碑爆棚+今日特价"
      ],
      keywords: ["爆款", "秒杀", "疯抢", "手慢无", "超值"],
      tips: "快速展示卖点，突出价格优势"
    }),
    promotion_rules: JSON.stringify({
      patterns: [
        "倒计时+数量告急+最后一波",
        "价格对比+限时特价+马上抢",
        "库存有限+抢完为止+速度下单"
      ],
      tips: "持续制造紧迫感，推动快速决策"
    }),
    closing_rules: JSON.stringify({
      patterns: [
        "最后机会+倒计时+下单入口",
        "库存清空+感谢支持+下波预告",
        "收官总结+感谢家人们+明天见"
      ],
      tips: "高效收尾，快速转入下一个产品"
    }),
    example_scripts: JSON.stringify([
      {
        scene: "开场白",
        script: "家人们注意啦！今天这场直播超级重磅！咱们清真五香系列爆款来袭，全场秒杀价！准备好了吗？3、2、1，开抢！"
      },
      {
        scene: "产品介绍",
        script: "这个牛舌，你们知道平时卖多少钱吗？68一斤！今天直播间，直接半价！34块钱！而且品质绝对不打折，正宗清真，新鲜现做！"
      },
      {
        scene: "逼单",
        script: "注意啦！注意啦！只剩最后50单了！抢到的家人们恭喜你们，没抢到的抓紧了，倒计时10秒！10、9、8...准备好了吗？"
      }
    ])
  },
  {
    name: "故事情怀型",
    description: "通过讲述产品背后的故事，建立情感连接。适合特色农产品、地方特产。",
    style_type: "故事型",
    tone_guidelines: "语气温和，有故事感，像在娓娓道来。多用'还记得'、'小时候'、'家乡'等词汇。节奏舒缓，给观众代入感。注重情感共鸣。",
    opening_rules: JSON.stringify({
      patterns: [
        "回忆引入+家乡味道+今天带来",
        "故事开场+产品缘起+价值传递",
        "情感共鸣+产品连接+真诚推荐"
      ],
      tips: "用故事或回忆开场，制造情感氛围"
    }),
    selling_rules: JSON.stringify({
      patterns: [
        "产品故事+匠心传承+品质坚持",
        "家乡记忆+童年味道+正宗传承",
        "原料产地+制作工艺+真心实意"
      ],
      keywords: ["家乡", "记忆", "传承", "手艺", "初心"],
      tips: "把产品与情感故事结合"
    }),
    promotion_rules: JSON.stringify({
      patterns: [
        "分享价值+感恩回馈+特别优惠",
        "支持家乡+品质传承+实在价格",
        "老顾客专享+感谢一路陪伴"
      ],
      tips: "优惠要有温度，像是给朋友分享"
    }),
    closing_rules: JSON.stringify({
      patterns: [
        "故事收尾+感谢聆听+期待相遇",
        "传递温暖+下单指引+常来坐坐",
        "初心不改+品质如一+明天见"
      ],
      tips: "温馨收尾，留下好印象"
    }),
    example_scripts: JSON.stringify([
      {
        scene: "开场白",
        script: "大家好呀。今天我想跟你们分享一个特别的东西。还记得小时候，每到过年，奶奶都会做一锅香喷喷的牛杂...那个味道，我到现在都忘不了。"
      },
      {
        scene: "产品介绍",
        script: "这个牛杂，是我们家三代人的手艺。从爷爷那辈开始，就在县城摆摊。用的都是当天新鲜的食材，香料是奶奶留下的老配方，20多种，缺一样都不行。"
      },
      {
        scene: "逼单",
        script: "今天把这个分享给大家，不是为了赚多少钱，就是想让更多人尝到这个正宗的味道。我知道外面很多都是速冻的，但咱们这个，真的是一口下去，满满的家乡味。"
      }
    ])
  },
  {
    name: "专业科普型",
    description: "侧重产品知识讲解，建立专业信任。适合品质农产品、有机食品等。",
    style_type: "专业型",
    tone_guidelines: "语气专业但不生硬，像老师讲课但更亲切。多用数据、事实支撑观点。条理清晰，分点讲解。适当回答观众问题。",
    opening_rules: JSON.stringify({
      patterns: [
        "知识点引入+产品关联+今天主题",
        "问题开场+解答预告+产品介绍",
        "专业视角+产品价值+干货分享"
      ],
      tips: "用知识点或问题开场，展示专业性"
    }),
    selling_rules: JSON.stringify({
      patterns: [
        "原料分析+工艺讲解+品质对比",
        "营养成分+适用人群+食用建议",
        "产地溯源+品质标准+选购技巧"
      ],
      keywords: ["蛋白质", "营养", "工艺", "标准", "认证"],
      tips: "用专业知识支撑产品价值"
    }),
    promotion_rules: JSON.stringify({
      patterns: [
        "品质保障+性价比分析+购买建议",
        "对比分析+选择理由+专业推荐",
        "营养价值+合理价格+适合人群"
      ],
      tips: "用专业角度分析性价比"
    }),
    closing_rules: JSON.stringify({
      patterns: [
        "知识总结+产品回顾+购买指引",
        "答疑时间+重点强调+感谢关注",
        "专业建议+长期价值+持续分享"
      ],
      tips: "专业收尾，展现长期价值"
    }),
    example_scripts: JSON.stringify([
      {
        scene: "开场白",
        script: "大家好，今天我们来聊聊牛蹄筋。很多人问，牛蹄筋到底有什么营养价值？为什么说它是'胶原蛋白之王'？今天我就给大家详细讲讲。"
      },
      {
        scene: "产品介绍",
        script: "首先，牛蹄筋的主要成分是胶原蛋白，每100克含有约35克蛋白质，脂肪含量却不到3克。这个蛋白质含量比牛肉还高。而且它富含甘氨酸，对皮肤特别好。"
      },
      {
        scene: "逼单",
        script: "咱们这款五香牛蹄筋，选用的是黄牛后腿筋，这个部位的蹄筋胶原蛋白含量最高。经过12小时卤制，软糯入味。市面上一斤要60多，今天直播间42块钱，还包邮。"
      }
    ])
  },
  {
    name: "互动娱乐型",
    description: "轻松幽默、互动性强的直播风格。适合年轻用户群体。",
    style_type: "娱乐型",
    tone_guidelines: "语气活泼、幽默，经常和观众互动。多用网络流行语、表情包式的表达。节奏轻快，营造欢乐氛围。经常抛出互动话题。",
    opening_rules: JSON.stringify({
      patterns: [
        "幽默开场+今日话题+互动预热",
        "热梗引入+产品关联+福利预告",
        "问好互动+小游戏+产品登场"
      ],
      tips: "有趣开场，快速拉近距离"
    }),
    selling_rules: JSON.stringify({
      patterns: [
        "趣味比喻+卖点展示+互动提问",
        "场景演绎+效果展示+观众参与",
        "搞笑对比+真实验证+推荐理由"
      ],
      keywords: ["绝了", "yyds", "冲冲冲", "入股不亏", "真香"],
      tips: "用有趣的方式展示卖点"
    }),
    promotion_rules: JSON.stringify({
      patterns: [
        "游戏互动+福利奖励+限时优惠",
        "抽奖预告+下单参与+幸运时刻",
        "弹幕互动+专属优惠+感谢支持"
      ],
      tips: "让优惠变得有趣"
    }),
    closing_rules: JSON.stringify({
      patterns: [
        "感谢互动+精彩回顾+下播预告",
        "最后互动+下次福利+记得关注",
        "总结亮点+欢乐收尾+期待再见"
      ],
      tips: "欢乐收尾，期待感拉满"
    }),
    example_scripts: JSON.stringify([
      {
        scene: "开场白",
        script: "家人们好呀！今天咱们直播间又整活了！你们猜今天带来了什么好东西？评论区打出你们的猜测，猜对的有惊喜哦~"
      },
      {
        scene: "产品介绍",
        script: "就是这个牛舌！不是吹，这个牛舌真的绝了，入口即化，比奶茶还上瘾！不信你们看这个色泽，看这个纹理，我要是骗你们，我当场把手机吃了！"
      },
      {
        scene: "逼单",
        script: "来来来，今天搞个互动。评论扣1的都有机会参与抽奖，一等奖免单，二等奖半价，三等奖送小吃一份。准备好了吗？我要开始了哦！"
      }
    ])
  },
  {
    name: "产地溯源型",
    description: "强调原产地、品质保证的直播风格。适合地理标志产品、特色农产品。",
    style_type: "溯源型",
    tone_guidelines: "语气真诚、实在，强调'正宗'、'原产地'、'品质保证'。多展示产地、工厂、认证等真实素材。给观众安全感。",
    opening_rules: JSON.stringify({
      patterns: [
        "产地介绍+品质承诺+今日推荐",
        "溯源开场+品质保障+产品登场",
        "认证展示+正宗保证+欢迎验证"
      ],
      tips: "用产地和认证开场，建立信任"
    }),
    selling_rules: JSON.stringify({
      patterns: [
        "产地优势+品质特点+认证背书",
        "源头直供+无中间商+品质保证",
        "工艺传承+标准认证+真材实料"
      ],
      keywords: ["原产地", "源头", "认证", "正宗", "直供"],
      tips: "用真实素材支撑产地故事"
    }),
    promotion_rules: JSON.stringify({
      patterns: [
        "源头价格+品质保证+售后无忧",
        "直供优惠+正品保证+支持验货",
        "溯源福利+品质承诺+安心购买"
      ],
      tips: "强调源头直供的价格优势"
    }),
    closing_rules: JSON.stringify({
      patterns: [
        "产地回顾+品质承诺+购买指引",
        "溯源总结+信任传递+感谢信任",
        "品质如一+持续溯源+欢迎监督"
      ],
      tips: "用品质保证收尾"
    }),
    example_scripts: JSON.stringify([
      {
        scene: "开场白",
        script: "大家好，我是来自内蒙古的牧民阿木尔。今天给大家带来的，是我们家乡草原上散养黄牛做的五香牛肉，真正的草原味道。"
      },
      {
        scene: "产品介绍",
        script: "你们看这个牛肉的纹理，这是真正吃草长大的牛。我们的牛都是草原上散养的，不喂饲料，吃的是天然牧草。这是我们的检疫证明，这是绿色食品认证，大家可以放心购买。"
      },
      {
        scene: "逼单",
        script: "今天直播间直供，没有中间商。同样的品质，在超市要卖80一斤，今天我给家人们的源头价是58，还包邮。支持验货，有任何问题直接退，邮费我出。"
      }
    ])
  }
];

// 初始化农产品专属风格模板
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 检查是否已有模板
    const { data: existingTemplates, error: checkError } = await client
      .from("style_templates")
      .select("name");
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    const existingNames = (existingTemplates || []).map(t => t.name);
    
    // 只插入不存在的模板
    const templatesToInsert = AGRICULTURAL_PRODUCT_TEMPLATES.filter(
      t => !existingNames.includes(t.name)
    );
    
    if (templatesToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: "所有模板已存在，无需重复初始化",
        insertedCount: 0,
      });
    }
    
    // 插入新模板
    const { data, error } = await client
      .from("style_templates")
      .insert(templatesToInsert)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `成功初始化 ${templatesToInsert.length} 个农产品专属风格模板`,
      insertedCount: templatesToInsert.length,
      data,
    });
  } catch (error) {
    console.error("Init templates error:", error);
    return NextResponse.json(
      { error: "初始化风格模板失败" },
      { status: 500 }
    );
  }
}

// 获取模板列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("style_templates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data,
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json(
      { error: "获取风格模板失败" },
      { status: 500 }
    );
  }
}
