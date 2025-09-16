from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
import json
import httpx
import os
from abc import ABC, abstractmethod

# FastAPI应用初始化
app = FastAPI(
    title="生词记录系统 API",
    description="支持划词取词和生词管理的后端服务",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "chrome-extension://*", "file://*", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库配置
DATABASE_URL = "sqlite:///./vocabulary.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 数据库模型
class Word(Base):
    __tablename__ = "words"
    
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, unique=True, index=True, nullable=False)
    pronunciation = Column(String)
    definitions = Column(Text)  # JSON格式
    pos_tags = Column(String)   # 词性标签
    difficulty_level = Column(String, default="unknown")
    examples = Column(Text)     # JSON格式
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    records = relationship("WordRecord", back_populates="word")

class WordRecord(Base):
    __tablename__ = "word_records"
    
    id = Column(Integer, primary_key=True, index=True)
    word_id = Column(Integer, ForeignKey("words.id"))
    source_url = Column(String)
    source_context = Column(Text)
    personal_notes = Column(Text)
    mastery_level = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    word = relationship("Word", back_populates="records")

# 创建数据库表
Base.metadata.create_all(bind=engine)

# Pydantic模型
class WordDefinition(BaseModel):
    word: str
    pronunciation: Optional[str] = None
    definitions: List[dict]
    examples: List[str] = []
    pos_tags: Optional[str] = None

class WordCreate(BaseModel):
    word: str
    source_url: Optional[str] = None
    source_context: Optional[str] = None
    personal_notes: Optional[str] = None

class WordResponse(BaseModel):
    id: int
    word: str
    pronunciation: Optional[str]
    definitions: List[dict]
    examples: List[str]
    pos_tags: Optional[str]
    mastery_level: int = 0
    review_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

class DictionaryConfigRequest(BaseModel):
    provider: str
    microsoft_subscription_key: Optional[str] = None
    microsoft_region: Optional[str] = None

class DictionaryConfigResponse(BaseModel):
    provider: str
    microsoft_configured: bool
    available_providers: List[str]

class TranslateRequest(BaseModel):
    text: str
    from_lang: str = "en"
    to_lang: str = "zh"

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    from_lang: str
    to_lang: str

# API配置
class DictionaryProviderType(Enum):
    FREE_DICTIONARY = "free_dictionary"
    MICROSOFT = "microsoft"

class DictionaryConfig:
    def __init__(self):
        self.provider = DictionaryProviderType.FREE_DICTIONARY
        self.microsoft_subscription_key = os.getenv("MICROSOFT_TRANSLATOR_KEY", "")
        self.microsoft_region = os.getenv("MICROSOFT_TRANSLATOR_REGION", "")

# 全局配置实例
dictionary_config = DictionaryConfig()

# 依赖注入
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 抽象词典服务接口
class DictionaryProvider(ABC):
    @abstractmethod
    async def lookup_word(self, word: str) -> Optional[WordDefinition]:
        pass

# Free Dictionary API实现
class FreeDictionaryProvider(DictionaryProvider):
    @staticmethod
    async def lookup_word(word: str) -> Optional[WordDefinition]:
        """使用Free Dictionary API查询单词释义"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}")
                
                if response.status_code == 200:
                    data = response.json()[0]
                    
                    # 解析释义
                    definitions = []
                    examples = []
                    pos_tags = []
                    
                    for meaning in data.get("meanings", []):
                        pos = meaning.get("partOfSpeech", "")
                        if pos:
                            pos_tags.append(pos)
                        
                        for definition in meaning.get("definitions", []):
                            definitions.append({
                                "partOfSpeech": pos,
                                "meaning": definition.get("definition", ""),
                                "example": definition.get("example", "")
                            })
                            
                            if definition.get("example"):
                                examples.append(definition["example"])
                    
                    # 获取发音
                    pronunciation = ""
                    for phonetic in data.get("phonetics", []):
                        if phonetic.get("text"):
                            pronunciation = phonetic["text"]
                            break
                    
                    return WordDefinition(
                        word=word,
                        pronunciation=pronunciation,
                        definitions=definitions,
                        examples=examples,
                        pos_tags=", ".join(set(pos_tags))
                    )
                elif response.status_code == 404:
                    return None
                    
        except Exception as e:
            print(f"Free Dictionary API查询失败: {e}")
            return None
        
        return None

# Microsoft Translator API实现
class MicrosoftDictionaryProvider(DictionaryProvider):
    def __init__(self, subscription_key: str, region: str = ""):
        self.subscription_key = subscription_key
        self.region = region
        
    async def lookup_word(self, word: str) -> Optional[WordDefinition]:
        """使用Microsoft Translator API查询单词释义"""
        if not self.subscription_key:
            print("Microsoft Translator API密钥未配置")
            return None
            
        try:
            headers = {
                'Ocp-Apim-Subscription-Key': self.subscription_key,
                'Content-type': 'application/json'
            }
            
            if self.region:
                headers['Ocp-Apim-Subscription-Region'] = self.region
            
            # 查询英文单词的定义（英文到英文）
            async with httpx.AsyncClient() as client:
                # 使用dictionary lookup API获取同义词和释义
                lookup_url = "https://api.cognitive.microsofttranslator.com/dictionary/lookup"
                params = {
                    'api-version': '3.0',
                    'from': 'en',
                    'to': 'en'  # 英文到英文查找同义词
                }
                
                body = [{'Text': word}]
                
                response = await client.post(lookup_url, params=params, headers=headers, json=body)
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        result = data[0]
                        translations = result.get('translations', [])
                        
                        definitions = []
                        pos_tags = []
                        examples = []
                        
                        for translation in translations:
                            pos_tag = translation.get('posTag', 'noun')
                            if pos_tag not in pos_tags:
                                pos_tags.append(pos_tag)
                            
                            # 使用displayTarget作为释义
                            meaning = translation.get('displayTarget', '')
                            if meaning:
                                definitions.append({
                                    "partOfSpeech": pos_tag,
                                    "meaning": meaning,
                                    "example": ""
                                })
                        
                        if definitions:
                            return WordDefinition(
                                word=word,
                                pronunciation="",  # Microsoft API不提供发音
                                definitions=definitions,
                                examples=examples,
                                pos_tags=", ".join(pos_tags)
                            )
                
                # 如果英文到英文查询失败，尝试英文到中文
                params['to'] = 'zh'
                response = await client.post(lookup_url, params=params, headers=headers, json=body)
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        result = data[0]
                        translations = result.get('translations', [])
                        
                        definitions = []
                        pos_tags = []
                        
                        for translation in translations:
                            pos_tag = translation.get('posTag', 'noun')
                            if pos_tag not in pos_tags:
                                pos_tags.append(pos_tag)
                            
                            meaning = translation.get('displayTarget', '')
                            if meaning:
                                definitions.append({
                                    "partOfSpeech": pos_tag,
                                    "meaning": meaning,
                                    "example": ""
                                })
                        
                        if definitions:
                            return WordDefinition(
                                word=word,
                                pronunciation="",
                                definitions=definitions,
                                examples=[],
                                pos_tags=", ".join(pos_tags)
                            )
                        
        except Exception as e:
            print(f"Microsoft Dictionary API查询失败: {e}")
            return None
        
        return None

# 词典服务类
class DictionaryService:
    @staticmethod
    async def lookup_word(word: str, provider: str = None) -> Optional[WordDefinition]:
        """查询单词释义"""
        # 确定使用的API提供商
        if provider:
            try:
                selected_provider = DictionaryProviderType(provider)
            except ValueError:
                selected_provider = dictionary_config.provider
        else:
            selected_provider = dictionary_config.provider
        
        # 根据选择的提供商创建对应的实例
        if selected_provider == DictionaryProviderType.FREE_DICTIONARY:
            provider_instance = FreeDictionaryProvider()
        elif selected_provider == DictionaryProviderType.MICROSOFT:
            provider_instance = MicrosoftDictionaryProvider(
                dictionary_config.microsoft_subscription_key,
                dictionary_config.microsoft_region
            )
        else:
            provider_instance = FreeDictionaryProvider()  # 默认使用Free Dictionary
        
        # 尝试使用选择的API查询
        try:
            result = await provider_instance.lookup_word(word)
            if result:
                return result
        except Exception as e:
            print(f"主要词典API查询失败: {e}")
        
        # 如果主要API失败，尝试备用API
        if selected_provider == DictionaryProviderType.MICROSOFT:
            try:
                backup_provider = FreeDictionaryProvider()
                result = await backup_provider.lookup_word(word)
                if result:
                    return result
            except Exception as e:
                print(f"备用词典API查询失败: {e}")
        
        # 所有API都失败时，返回fallback定义
        return DictionaryService.create_fallback_definition(word)

    @staticmethod
    def create_fallback_definition(word: str) -> WordDefinition:
        """为找不到定义的单词创建基本信息"""
        # 根据单词特征推测类型
        pos_tag = "noun"  # 默认为名词
        meaning = f"'{word}' - 词典中暂无此词条的详细释义"

        # 识别一些常见的专有名词和技术词汇
        tech_words = {
            'javascript': ('JavaScript', 'noun', '一种广泛使用的编程语言，主要用于网页开发'),
            'html': ('HTML', 'noun', '超文本标记语言，用于创建网页的标准标记语言'),
            'css': ('CSS', 'noun', '层叠样式表，用于描述网页样式的样式表语言'),
            'python': ('Python', 'noun', '一种高级编程语言，以其简洁和可读性著称'),
            'react': ('React', 'noun', '用于构建用户界面的JavaScript库'),
            'vue': ('Vue', 'noun', '渐进式JavaScript框架'),
            'angular': ('Angular', 'noun', '基于TypeScript构建的Web应用框架'),
            'nodejs': ('Node.js', 'noun', '基于Chrome V8引擎的JavaScript运行环境'),
            'typescript': ('TypeScript', 'noun', 'JavaScript的超集，添加了类型系统'),
            'github': ('GitHub', 'noun', '基于Git的代码托管平台'),
            'api': ('API', 'noun', '应用程序编程接口'),
            'json': ('JSON', 'noun', 'JavaScript对象表示法，轻量级数据交换格式'),
            'sql': ('SQL', 'noun', '结构化查询语言，用于管理关系型数据库'),
            'ai': ('AI', 'noun', '人工智能'),
            'ml': ('ML', 'noun', '机器学习'),
            'ui': ('UI', 'noun', '用户界面'),
            'ux': ('UX', 'noun', '用户体验'),
        }

        word_lower = word.lower()
        if word_lower in tech_words:
            display_word, pos_tag, meaning = tech_words[word_lower]
            word = display_word

        return WordDefinition(
            word=word,
            pronunciation="",
            definitions=[{
                "partOfSpeech": pos_tag,
                "meaning": meaning,
                "example": ""
            }],
            examples=[],
            pos_tags=pos_tag
        )

# 翻译服务类
class TranslationService:
    @staticmethod
    async def translate_text(text: str, from_lang: str = "en", to_lang: str = "zh") -> Optional[TranslateResponse]:
        """使用Microsoft Translator API翻译文本"""
        if not dictionary_config.microsoft_subscription_key:
            print("Microsoft Translator API密钥未配置")
            return None
            
        try:
            headers = {
                'Ocp-Apim-Subscription-Key': dictionary_config.microsoft_subscription_key,
                'Content-type': 'application/json'
            }
            
            if dictionary_config.microsoft_region:
                headers['Ocp-Apim-Subscription-Region'] = dictionary_config.microsoft_region
            
            # 使用Microsoft Translator API进行翻译
            async with httpx.AsyncClient() as client:
                translate_url = "https://api.cognitive.microsofttranslator.com/translate"
                params = {
                    'api-version': '3.0',
                    'from': from_lang,
                    'to': to_lang
                }
                
                body = [{'Text': text}]
                
                response = await client.post(translate_url, params=params, headers=headers, json=body)
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        result = data[0]
                        translations = result.get('translations', [])
                        
                        if translations:
                            translated_text = translations[0].get('text', '')
                            return TranslateResponse(
                                original_text=text,
                                translated_text=translated_text,
                                from_lang=from_lang,
                                to_lang=to_lang
                            )
                        
        except Exception as e:
            print(f"翻译失败: {e}")
            return None
        
        return None

# API路由
@app.get("/")
async def root():
    return {"message": "生词记录系统 API 服务"}

@app.get("/api/words/{word}/lookup")
async def lookup_word(word: str, provider: Optional[str] = None):
    """查询单词释义"""
    definition = await DictionaryService.lookup_word(word, provider)
    if definition is None:
        raise HTTPException(status_code=404, detail="未找到该单词的释义")
    return definition

@app.post("/api/words", response_model=WordResponse)
async def add_word(word_data: WordCreate, db: Session = Depends(get_db)):
    """添加生词到词库"""
    # 检查单词是否已存在
    existing_word = db.query(Word).filter(Word.word == word_data.word.lower()).first()
    
    if existing_word:
        # 如果单词已存在，添加新的记录
        new_record = WordRecord(
            word_id=existing_word.id,
            source_url=word_data.source_url,
            source_context=word_data.source_context,
            personal_notes=word_data.personal_notes
        )
        db.add(new_record)
        db.commit()
        
        # 返回现有单词信息
        return WordResponse(
            id=existing_word.id,
            word=existing_word.word,
            pronunciation=existing_word.pronunciation,
            definitions=json.loads(existing_word.definitions) if existing_word.definitions else [],
            examples=json.loads(existing_word.examples) if existing_word.examples else [],
            pos_tags=existing_word.pos_tags,
            mastery_level=0,
            review_count=0,
            created_at=existing_word.created_at
        )
    
    # 查询单词释义
    definition = await DictionaryService.lookup_word(word_data.word)
    
    if definition is None:
        raise HTTPException(status_code=404, detail="无法获取该单词的释义")
    
    # 创建新单词记录
    new_word = Word(
        word=word_data.word.lower(),
        pronunciation=definition.pronunciation,
        definitions=json.dumps(definition.definitions),
        pos_tags=definition.pos_tags,
        examples=json.dumps(definition.examples)
    )
    
    db.add(new_word)
    db.flush()  # 获取新单词的ID
    
    # 创建学习记录
    new_record = WordRecord(
        word_id=new_word.id,
        source_url=word_data.source_url,
        source_context=word_data.source_context,
        personal_notes=word_data.personal_notes
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_word)
    
    return WordResponse(
        id=new_word.id,
        word=new_word.word,
        pronunciation=new_word.pronunciation,
        definitions=json.loads(new_word.definitions) if new_word.definitions else [],
        examples=json.loads(new_word.examples) if new_word.examples else [],
        pos_tags=new_word.pos_tags,
        mastery_level=0,
        review_count=0,
        created_at=new_word.created_at
    )

@app.get("/api/words", response_model=List[WordResponse])
async def get_words(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取生词列表"""
    query = db.query(Word)
    
    if search:
        query = query.filter(Word.word.contains(search.lower()))
    
    words = query.offset(skip).limit(limit).all()
    
    result = []
    for word in words:
        # 获取最新的学习记录
        latest_record = db.query(WordRecord).filter(WordRecord.word_id == word.id).first()
        
        result.append(WordResponse(
            id=word.id,
            word=word.word,
            pronunciation=word.pronunciation,
            definitions=json.loads(word.definitions) if word.definitions else [],
            examples=json.loads(word.examples) if word.examples else [],
            pos_tags=word.pos_tags,
            mastery_level=latest_record.mastery_level if latest_record else 0,
            review_count=latest_record.review_count if latest_record else 0,
            created_at=word.created_at
        ))
    
    return result

@app.delete("/api/words/{word_id}")
async def delete_word(word_id: int, db: Session = Depends(get_db)):
    """删除生词"""
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="未找到该单词")
    
    # 删除相关记录
    db.query(WordRecord).filter(WordRecord.word_id == word_id).delete()
    db.delete(word)
    db.commit()
    
    return {"message": "删除成功"}

@app.put("/api/words/{word_id}/mastery")
async def update_mastery(
    word_id: int, 
    mastery_level: int, 
    db: Session = Depends(get_db)
):
    """更新单词掌握程度"""
    record = db.query(WordRecord).filter(WordRecord.word_id == word_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="未找到学习记录")
    
    record.mastery_level = mastery_level
    record.review_count += 1
    record.last_reviewed = datetime.utcnow()
    
    db.commit()
    
    return {"message": "更新成功"}

@app.get("/api/dictionary/config", response_model=DictionaryConfigResponse)
async def get_dictionary_config():
    """获取当前字典API配置"""
    return DictionaryConfigResponse(
        provider=dictionary_config.provider.value,
        microsoft_configured=bool(dictionary_config.microsoft_subscription_key),
        available_providers=[provider.value for provider in DictionaryProviderType]
    )

@app.post("/api/dictionary/config")
async def update_dictionary_config(config: DictionaryConfigRequest):
    """更新字典API配置"""
    try:
        # 验证provider值是否有效
        provider_type = DictionaryProviderType(config.provider)
        dictionary_config.provider = provider_type
        
        # 更新Microsoft配置
        if config.microsoft_subscription_key:
            dictionary_config.microsoft_subscription_key = config.microsoft_subscription_key
        if config.microsoft_region:
            dictionary_config.microsoft_region = config.microsoft_region
        
        return {
            "message": "配置更新成功",
            "provider": config.provider,
            "microsoft_configured": bool(dictionary_config.microsoft_subscription_key)
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的API提供商")

@app.get("/api/dictionary/providers")
async def get_available_providers():
    """获取可用的字典API提供商列表"""
    return {
        "providers": [
            {
                "id": DictionaryProviderType.FREE_DICTIONARY.value,
                "name": "Free Dictionary API",
                "description": "免费的英文字典API，提供详细的单词定义、发音和例句",
                "requires_key": False
            },
            {
                "id": DictionaryProviderType.MICROSOFT.value,
                "name": "Microsoft Translator",
                "description": "微软翻译API，支持多语言翻译和词典查询",
                "requires_key": True
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)