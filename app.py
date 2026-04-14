import os
import joblib
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-v-key-321')
# Use DATABASE_URL from environment if provided; otherwise fall back to a local SQLite DB
# On Vercel, the filesystem is read-only. We use /tmp for the SQLite db if running in serverless.
if os.environ.get('VERCEL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/dyslexia.db'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///dyslexia.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
# Model placeholder
model = None

def get_model():
    global model
    if model is None:
        MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml_model', 'dyslexia_model.pkl')
        try:
            import joblib
            model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Warning: Model could not be loaded: {e}")
    return model

login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Translations ---
TRANSLATIONS = {
    'en': {
        'title': 'Dyslexia Hub',
        'home': 'Home',
        'about': 'About',
        'tools': 'Tools',
        'contact': 'Contact',
        'login': 'Login',
        'register': 'Register',
        'hero_title': 'Learn in Your Own Way',
        'hero_subtitle': 'Empowering learners with dyslexia through tailored tools and technology.',
        'start_test': 'Start Screening Test',
        'why_title': 'Why This Website?',
        'who_title': 'Who Is It For?',
        'lang_name': 'English',
        'welcome': 'Welcome',
        'history': 'Assessment History',
        'score': 'Score',
        'interpretation': 'Interpretation',
        'logout': 'Logout',
        'dashboard': 'Dashboard',
        'new_test': 'New Test',
        'no_results': 'No assessments found. Start your first screening test today!',
        'about_text': 'We empower dyslexic minds with tools designed for their unique strengths.',
        'contact_text': 'Have questions? We are here to help.',
        'send_msg': 'Send Message',
        'name': 'Name',
        'msg': 'Message',
        'explore_module': 'Explore Module',
        'about_description': 'Our specialized learning hub provides over 10+ tailored tools and strategies, helping 500+ learners overcome obstacles and achieve their full potential.',
        'for_students': 'For Students',
        'for_parents': 'For Parents',
        'for_teachers': 'For Teachers',
        'student_test': 'Student Assessment',
        'parent_test': 'Parent Assessment',
        'teacher_test': 'Teacher Assessment',
        'general_test': 'General Assessment',
        'email_label': 'Email Address',
        'placeholder_name': 'Enter your full name',
        'placeholder_email': 'Enter your email address',
        'placeholder_msg': 'How can we help you?',
        'for_everyone': 'For Everyone',
        'tools_title': 'Accessibility Tools',
        'tools_subtitle': 'Customize your reading and writing experience.',
        'back_to_modules': '← Back to All Modules',
        'click_to_start': 'Click to Start Recording',
        'listening': 'Listening...',
        'recording_paused': 'Recording Paused',
        'spoken_placeholder': 'Your spoken words will appear here...',
        'clear_text': 'Clear',
        'copy_text': 'Copy Text',
        'add_idea': '+ Add Idea',
        'main_topic': 'Main Topic',
        'mindmap_hint': 'Add your thoughts to visualize them.',
        'grammar_hint': 'Type or paste text. We\'ll check for common dyslexic patterns.',
        'check_fix': 'Check & Fix Text',
        'suggestions_applied': 'Suggestions Applied:',
        'simplify_steps': 'Simplify Steps',
        'seq_hint': 'Paste complex instructions and we\'ll break them into steps.',
        'voice_reminders': 'Voice Reminders',
        'record_new': 'Record New Note',
        'start_focus': 'Start Focus',
        'pause': 'Pause',
        'break_time': 'Break time!',
        'bead_hint': 'Click beads to count.',
        'total': 'Total:',
        'visual_strategy': 'Visual Strategy',
        'tens': 'Tens',
        'units': 'Units',
        'tens_label': 'Tens:',
        'units_label': 'Units:',
        'loading': 'Loading...',
        'routine_morning': 'Morning',
        'routine_afternoon': 'Afternoon',
        'routine_night': 'Night',
        'check_planner': 'Check Planner',
        'reading_title': 'Reading Solutions',
        'reading_desc': 'Techniques to improve reading speed and comprehension.',
        'reading_full': 'Our reading tools help overcome visual stress and improve word recognition through science-backed techniques.',
        'overlay_name': 'Colored Overlays',
        'overlay_desc': 'Digital filters to reduce glare and visual discomfort.',
        'overlay_action': 'Apply Filter',
        'guided_name': 'Guided Reading',
        'guided_desc': 'Focus on one line at a time to prevent skipping.',
        'guided_action': 'Launch Tool',
        'font_name': 'Dyslexic Fonts',
        'font_desc': 'Fonts with weighted bottoms to prevent letter flipping.',
        'font_action': 'Switch Font',
        'writing_title': 'Writing Support',
        'writing_desc': 'Tools and tips for better spelling and grammar.',
        'writing_full': 'Master the art of expression with tools that handle the mechanics, letting your creativity flow.',
        'dictation_name': 'Dictation Tool',
        'dictation_desc': 'Convert your voice to text instantly.',
        'dictation_action': 'Start Recording',
        'mindmap_name': 'Mind Mapping',
        'mindmap_desc': 'Organize thoughts visually before writing.',
        'mindmap_action': 'Open Map',
        'grammar_name': 'Grammar Assistant',
        'grammar_desc': 'Smart checks for common dyslexic patterns.',
        'grammar_action': 'Check Text',
        'memory_title': 'Memory Aids',
        'memory_desc': 'Strategies to remember instructions and sequences.',
        'memory_full': 'Never lose track of a task again with visual reminders and sequenced instruction tools.',
        'timetable_name': 'Visual Timetables',
        'timetable_desc': 'Schedule your day with icons and colors.',
        'timetable_action': 'View Schedule',
        'sequence_name': 'Sequence Breaker',
        'sequence_desc': 'Break complex steps into single tasks.',
        'sequence_action': 'Simple View',
        'voice_name': 'Voice Notes',
        'voice_desc': 'Quick audio reminders for later.',
        'voice_action': 'Record Hint',
        'focus_title': 'Focus Support',
        'focus_desc': 'Tools to minimize distractions and improve concentration.',
        'focus_full': 'Create a calm learning environment with tools designed to keep your mind on the task at hand.',
        'pomodoro_name': 'Pomodoro Timer',
        'pomodoro_desc': 'Work in short bursts with scheduled breaks.',
        'pomodoro_action': 'Start Timer',
        'noise_name': 'Noise Masking',
        'noise_desc': 'Ambient sounds to block out auditory distractions.',
        'noise_action': 'Play Sound',
        'limit_name': 'Task Limiter',
        'limit_desc': 'Focus on only one priority at a time.',
        'limit_action': 'Set Goal',
        'math_title': 'Math Mastering',
        'math_desc': 'Strategies for dyscalculia and math-related challenges.',
        'math_full': 'Overcome number anxiety with visual math tools and hands-on calculation strategies.',
        'abacus_name': 'Visual Abacus',
        'abacus_desc': 'See numbers as tangible objects.',
        'abacus_action': 'Open Abacus',
        'mathbreak_name': 'Math Breakdown',
        'mathbreak_desc': 'Step-by-step guides for long division/equations.',
        'mathbreak_action': 'Analyze',
        'symbol_name': 'Symbol Decoder',
        'symbol_desc': 'Clarify the meaning of complex math symbols.',
        'symbol_action': 'Decode',
        'org_title': 'Organization Hacks',
        'org_desc': 'Keep your physical and digital life in order.',
        'org_full': 'Declutter your space and your mind with structured organization systems.',
        'filing_name': 'Color Coded Filing',
        'filing_desc': 'Organize documents by color for quick retrieval.',
        'filing_action': 'See Guide',
        'declutter_name': 'Digital Declutter',
        'declutter_desc': 'Simple desktop and folder organization tips.',
        'declutter_action': 'Start Sort',
        'routine_name': 'Routine Builder',
        'routine_desc': 'Build consistent habits with visual checklists.',
        'routine_action': 'Create Habit'
    },
    'hi': {
        'title': 'डिस्लेक्सिया हब',
        'home': 'होम',
        'about': 'हमारे बारे में',
        'tools': 'उपकरण',
        'contact': 'संपर्क',
        'login': 'लॉगिन',
        'register': 'रजिस्टर',
        'hero_title': 'अपने तरीके से सीखें',
        'hero_subtitle': 'डिस्लेक्सिया वाले शिक्षार्थियों को विशेष उपकरणों और तकनीक के माध्यम से सशक्त बनाना।',
        'start_test': 'स्क्रीनिंग टेस्ट शुरू करें',
        'why_title': 'यह वेबसाइट क्यों?',
        'who_title': 'यह किसके लिए है?',
        'lang_name': 'हिंदी',
        'welcome': 'स्वागत है',
        'history': 'मूल्यांकन इतिहास',
        'score': 'स्कोर',
        'interpretation': 'व्याख्या',
        'logout': 'लॉगआउट',
        'dashboard': 'डैशबोर्ड',
        'new_test': 'नया टेस्ट',
        'no_results': 'कोई मूल्यांकन नहीं मिला। आज ही अपना पहला टेस्ट शुरू करें!',
        'about_text': 'हम डिस्लेक्सिया वाले लोगों को उनकी अद्वितीय क्षमताओं के लिए डिज़ाइन किए गए उपकरणों के साथ सशक्त बनाते हैं।',
        'contact_text': 'कोई प्रश्न है? हम यहाँ मदद के लिए हैं।',
        'send_msg': 'संदेश भेजें',
        'name': 'नाम',
        'msg': 'संदेश',
        'explore_module': 'मॉड्यूल देखें',
        'about_description': 'हमारा विशेष शिक्षण केंद्र 10+ से अधिक अनुरूप उपकरण और रणनीतियाँ प्रदान करता है, जो 500+ शिक्षार्थियों को बाधाओं को दूर करने और उनकी पूरी क्षमता प्राप्त करने में मदद करता है।',
        'for_students': 'छात्रों के लिए',
        'for_parents': 'अभिभावकों के लिए',
        'for_teachers': 'शिक्षकों के लिए',
        'student_test': 'छात्र मूल्यांकन',
        'parent_test': 'अभिभावक मूल्यांकन',
        'teacher_test': 'शिक्षक मूल्यांकन',
        'general_test': 'सामान्य मूल्यांकन',
        'email_label': 'ईमेल पता',
        'placeholder_name': 'अपना पूरा नाम दर्ज करें',
        'placeholder_email': 'अपना ईमेल पता दर्ज करें',
        'placeholder_msg': 'हम आपकी कैसे मदद कर सकते हैं?',
        'for_everyone': 'सभी के लिए',
        'tools_title': 'एक्सेसिबिलिटी टूल्स',
        'tools_subtitle': 'अपने पढ़ने और लिखने के अनुभव को अनुकूलित करें।',
        'back_to_modules': '← सभी मॉड्यूल पर वापस जाएं',
        'click_to_start': 'रिकॉर्डिंग शुरू करने के लिए क्लिक करें',
        'listening': 'सुन रहा है...',
        'recording_paused': 'रिकॉर्डिंग रुकी हुई है',
        'spoken_placeholder': 'आपके बोले गए शब्द यहाँ दिखाई देंगे...',
        'clear_text': 'साफ करें',
        'copy_text': 'टेक्स्ट कॉपी करें',
        'add_idea': '+ विचार जोड़ें',
        'main_topic': 'मुख्य विषय',
        'mindmap_hint': 'उन्हें देखने के लिए अपने विचार जोड़ें।',
        'grammar_hint': 'टेक्स्ट टाइप करें या पेस्ट करें। हम सामान्य डिस्लेक्सिक पैटर्न की जांच करेंगे।',
        'check_fix': 'टेक्स्ट जांचें और ठीक करें',
        'suggestions_applied': 'सुझाव लागू किए गए:',
        'simplify_steps': 'चरणों को सरल बनाएं',
        'seq_hint': 'जटिल निर्देशों को पेस्ट करें और हम उन्हें चरणों में तोड़ देंगे।',
        'voice_reminders': 'वॉइस रिमाइंडर',
        'record_new': 'नया नोट रिकॉर्ड करें',
        'start_focus': 'फोकस शुरू करें',
        'pause': 'रोकें',
        'break_time': 'ब्रेक का समय!',
        'bead_hint': 'गिनने के लिए मोतियों पर क्लिक करें।',
        'total': 'कुल:',
        'visual_strategy': 'दृश्य रणनीति',
        'tens': 'दहाई',
        'units': 'इकाई',
        'tens_label': 'दहाई:',
        'units_label': 'इकाई:',
        'loading': 'लोड हो रहा है...',
        'routine_morning': 'सुबह',
        'routine_afternoon': 'दोपहर',
        'routine_night': 'रात',
        'check_planner': 'प्लानर चेक करें',
        'reading_title': 'पठन समाधान',
        'reading_desc': 'पढ़ने की गति और समझ को बेहतर बनाने की तकनीकें।',
        'reading_full': 'हमारे पठन उपकरण वैज्ञानिक तकनीकों के माध्यम से दृश्य तनाव को दूर करने और शब्द पहचान में सुधार करने में मदद करते हैं।',
        'overlay_name': 'रंगीन ओवरले',
        'overlay_desc': 'चकाचौंध और दृश्य परेशानी को कम करने के लिए डिजिटल फ़िल्टर।',
        'overlay_action': 'फ़िल्टर लागू करें',
        'guided_name': 'निर्देशित पठन',
        'guided_desc': 'छोड़ने से बचने के लिए एक बार में एक ही पंक्ति पर ध्यान केंद्रित करें।',
        'guided_action': 'टूल लॉन्च करें',
        'font_name': 'डिस्लेक्सिक फोंट',
        'font_desc': 'अक्षरों के पलटने से बचने के लिए भारित निचले हिस्से वाले फोंट।',
        'font_action': 'फ़ॉन्ट बदलें',
        'writing_title': 'लेखन सहायता',
        'writing_desc': 'बेहतर स्पेलिंग और व्याकरण के लिए उपकरण और सुझाव।',
        'writing_full': 'उन उपकरणों के साथ अभिव्यक्ति की कला में महारत हासिल करें जो यांत्रिकी को संभालते हैं, जिससे आपकी रचनात्मकता प्रवाहित होती है।',
        'dictation_name': 'डिक्टेशन टूल',
        'dictation_desc': 'अपनी आवाज़ को तुरंत टेक्स्ट में बदलें।',
        'dictation_action': 'रिकॉर्डिंग शुरू करें',
        'mindmap_name': 'माइंड मैपिंग',
        'mindmap_desc': 'लिखने से पहले विचारों को व्यवस्थित करें।',
        'mindmap_action': 'मैप खोलें',
        'grammar_name': 'व्याकरण सहायक',
        'grammar_desc': 'सामान्य डिस्लेक्सिक पैटर्न के लिए स्मार्ट जाँच।',
        'grammar_action': 'टेक्स्ट जाँचें',
        'memory_title': 'स्मृति सहायक',
        'memory_desc': 'निर्देशों और अनुक्रमों को याद रखने की रणनीतियाँ।',
        'memory_full': 'विजुअल रिमाइंडर और अनुक्रमित निर्देश उपकरणों के साथ फिर कभी किसी कार्य को न भूलें।',
        'timetable_name': 'विजुअल टाइमटेबल',
        'timetable_desc': 'चिह्न और रंगों के साथ अपने दिन की योजना बनाएं।',
        'timetable_action': 'शेड्यूल देखें',
        'sequence_name': 'अनुक्रम संशोधक',
        'sequence_desc': 'जटिल चरणों को एकल कार्यों में तोड़ें।',
        'sequence_action': 'सरल दृश्य',
        'voice_name': 'वॉइस नोट्स',
        'voice_desc': 'बाद के लिए त्वरित ऑडियो अनुस्मारक।',
        'voice_action': 'हिंट रिकॉर्ड करें',
        'focus_title': 'फोकस सपोर्ट',
        'focus_desc': 'विकर्षणों को कम करने और एकाग्रता में सुधार करने के उपकरण।',
        'focus_full': 'एकाग्रता बनाए रखने के लिए डिज़ाइन किए गए उपकरणों के साथ एक शांत शिक्षण वातावरण बनाएं।',
        'pomodoro_name': 'पोमोडोरो टाइमर',
        'pomodoro_desc': 'निर्धारित ब्रेक के साथ छोटे अंतराल में काम करें।',
        'pomodoro_action': 'टाइमर शुरू करें',
        'noise_name': 'शोर मास्किंग',
        'noise_desc': 'ऑडिटरी विकर्षणों को रोकने के लिए परिवेशी ध्वनियाँ।',
        'noise_action': 'ध्वनि चलाएँ',
        'limit_name': 'कार्य सीमा',
        'limit_desc': 'एक बार में केवल एक प्राथमिकता पर ध्यान केंद्रित करें।',
        'limit_action': 'लक्ष्य निर्धारित करें',
        'math_title': 'गणित विशेषज्ञता',
        'math_desc': 'डिस्कैकुलिया और गणित से संबंधित चुनौतियों के लिए रणनीतियाँ।',
        'math_full': 'विजुअल गणित उपकरणों और व्यावहारिक गणना रणनीतियों के साथ संख्या चिंता को दूर करें।',
        'abacus_name': 'विजुअल एबेकस',
        'abacus_desc': 'संख्याओं को मूर्त वस्तुओं के रूप में देखें।',
        'abacus_action': 'एबेकस खोलें',
        'mathbreak_name': 'गणित ब्रेकडाउन',
        'mathbreak_desc': 'लंबे भाग/समीकरणों के लिए चरण-दर-चरण मार्गदर्शिका।',
        'mathbreak_action': 'विश्लेषण करें',
        'symbol_name': 'प्रतीक डिकोडर',
        'symbol_desc': 'जटिल गणितीय प्रतीकों के अर्थ स्पष्ट करें।',
        'symbol_action': 'डिकोड करें',
        'org_title': 'संगठन हैक्स',
        'org_desc': 'अपने भौतिक और डिजिटल जीवन को व्यवस्थित रखें।',
        'org_full': 'संरचित संगठन प्रणालियों के साथ अपने स्थान और अपने मन को अव्यवस्थित करें।',
        'filing_name': 'कलर कोडेड फाइलिंग',
        'filing_desc': 'त्वरित पुनर्प्राप्ति के लिए रंगों द्वारा दस्तावेज़ व्यवस्थित करें।',
        'filing_action': 'गाइड देखें',
        'declutter_name': 'डिजिटल डिक्लेटर',
        'declutter_desc': 'सरल डेस्कटॉप और फोल्डर संगठन युक्तियाँ।',
        'declutter_action': 'सॉर्ट शुरू करें',
        'routine_name': 'रूटीन बिल्डर',
        'routine_desc': 'दृश्य चेकलिस्ट के साथ सुसंगत आदतें बनाएं।',
        'routine_action': 'आदत बनाएं'
    },
    'mr': {
        'title': 'डिस्लेक्सिया हब',
        'home': 'होम',
        'about': 'आमच्याबद्दल',
        'tools': 'साधणे',
        'contact': 'संपर्क',
        'login': 'लॉगिन',
        'register': 'नोंदणी',
        'hero_title': 'तुमच्या स्वतःच्या पद्धतीने शिका',
        'hero_subtitle': 'डिस्लेक्सिया असलेल्या विद्यार्थ्यांना विशेष साधने आणि तंत्रज्ञानाद्वारे सक्षम करणे.',
        'start_test': 'स्क्रीनिंग चाचणी सुरू करा',
        'why_title': 'ही वेबसाइट का?',
        'who_title': 'ही वेबसाइट कोणासाठी आहे?',
        'lang_name': 'मराठी',
        'welcome': 'स्वागत आहे',
        'history': 'मूल्यांकन इतिहास',
        'score': 'गुण',
        'interpretation': 'स्पष्टीकरण',
        'logout': 'बाहेर पडा',
        'dashboard': 'डॅशबोर्ड',
        'new_test': 'नवीन चाचणी',
        'no_results': 'कोणतेही मूल्यांकन सापडले नाही. आजच आपली पहिली चाचणी सुरू करा!',
        'about_text': 'आम्ही डिस्लेक्सिया असलेल्या लोकांना त्यांच्या अद्वितीय क्षमतेसाठी डिझाइन केलेल्या साधनांद्वारे सक्षम करतो.',
        'contact_text': 'प्रश्न आहेत का? आम्ही मदत करण्यासाठी येथे आहोत.',
        'send_msg': 'संदेश पाठवा',
        'name': 'नाव',
        'msg': 'संदेश',
        'explore_module': 'मॉड्युल पहा',
        'about_description': 'आमचे विशेष शिक्षण केंद्र 10+ पेक्षा जास्त साधने आणि धोरणे प्रदान करते, ज्यामुळे 500+ विद्यार्थ्यांना अडथळ्यांवर मात करण्यास आणि त्यांची पूर्ण क्षमता गाठण्यास मदत होते.',
        'for_students': 'विद्यार्थ्यांसाठी',
        'for_parents': 'पालकांसाठी',
        'for_teachers': 'शिक्षकांसाठी',
        'student_test': 'विद्यार्थी मूल्यांकन',
        'parent_test': 'पालक मूल्यांकन',
        'teacher_test': 'शिक्षक मूल्यांकन',
        'general_test': 'सामान्य मूल्यांकन',
        'email_label': 'ईमेल पत्ता',
        'placeholder_name': 'तुमचे पूर्ण नाव टाका',
        'placeholder_email': 'तुमचा ईमेल पत्ता टाका',
        'placeholder_msg': 'आम्ही तुम्हाला कशी मदत करू शकतो?',
        'for_everyone': 'सर्वांसाठी',
        'tools_title': 'एक्सेसीबीलिटी साधने',
        'tools_subtitle': 'तुमचा वाचन आणि लेखनाचा अनुभव सानुकूलित करा।',
        'back_to_modules': '← सर्व मॉड्युल्सवर परत जा',
        'click_to_start': 'रेकॉर्डिंग सुरू करण्यासाठी क्लिक करा',
        'listening': 'ऐकत आहे...',
        'recording_paused': 'रेकॉर्डिंग थांबले आहे',
        'spoken_placeholder': 'तुमचे बोललेले शब्द येथे दिसतील...',
        'clear_text': 'साफ करा',
        'copy_text': 'मजकूर कॉपी करा',
        'add_idea': '+ कल्पना जोडा',
        'main_topic': 'मुख्य विषय',
        'mindmap_hint': 'तुमचे विचार दृश्य स्वरूपात पाहण्यासाठी ते जोडा.',
        'grammar_hint': 'मजकूर टाइप करा किंवा पेस्ट करा. आम्ही सामान्य डिस्लेक्सिक पॅटर्न तपासू.',
        'check_fix': 'मजकूर तपासा आणि दुरुस्त करा',
        'suggestions_applied': 'सुचवलेले बदल लागू केले:',
        'simplify_steps': 'पायऱ्या सोप्या करा',
        'seq_hint': 'जटिल सूचना पेस्ट करा आणि आम्ही त्यांचे पायऱ्यांमध्ये विभाजन करू.',
        'voice_reminders': 'व्हॉइस स्मरणपत्रे',
        'record_new': 'नवीन नोंद रेकॉर्ड करा',
        'start_focus': 'फोकस सुरू करा',
        'pause': 'थांबवा',
        'break_time': 'विश्रांतीची वेळ!',
        'bead_hint': 'मोजण्यासाठी मण्यांवर क्लिक करा.',
        'total': 'एकूण:',
        'visual_strategy': 'व्हिज्युअल स्ट्रॅटेजी',
        'tens': 'दशक',
        'units': 'एकक',
        'tens_label': 'दशक:',
        'units_label': 'एकक:',
        'loading': 'लोड होत आहे...',
        'routine_morning': 'सकाळ',
        'routine_afternoon': 'दुपार',
        'routine_night': 'रात्र',
        'check_planner': 'प्लॅनर तपासा',
        'reading_title': 'वाचन उपाय',
        'reading_desc': 'वाचनाचा वेग आणि आकलन सुधारण्यासाठी तंत्रे.',
        'reading_full': 'आमची वाचन साधने वैज्ञानिक तंत्रांद्वारे दृश्य ताण दूर करण्यास आणि शब्द ओळख सुधारण्यास मदत करतात.',
        'overlay_name': 'रंगीत ओव्हरले',
        'overlay_desc': 'चकाकी आणि दृश्य अस्वस्थता कमी करण्यासाठी डिजिटल फिल्टर.',
        'overlay_action': 'फिल्टर लागू करा',
        'guided_name': 'मार्गदर्शित वाचन',
        'guided_desc': 'ओळी सोडणे टाळण्यासाठी एका वेळी एकाच ओळीवर लक्ष केंद्रित करा.',
        'guided_action': 'टूल लाँँच करा',
        'font_name': 'डिस्लेक्सिक फॉन्ट',
        'font_desc': 'अक्षरे उलटणे टाळण्यासाठी खालच्या बाजूला वजन असलेले फॉन्ट.',
        'font_action': 'फॉन्ट बदला',
        'writing_title': 'लेखन सहाय्य',
        'writing_desc': 'उत्तम स्पेलिंग आणि व्याकरणासाठी साधने आणि टीपा.',
        'writing_full': 'यांत्रिकी हाताळणाऱ्या साधनांसह अभिव्यक्तीच्या कलेत प्रभुत्व मिळवा, ज्यामुळे तुमची सर्जनशीलता प्रवाहित होईल.',
        'dictation_name': 'डिक्टेशन टूल',
        'dictation_desc': 'तुमचा आवाज त्वरित मजकुरात रूपांतरित करा.',
        'dictation_action': 'रेकॉर्डिंग सुरू करा',
        'mindmap_name': 'माइंड मॅपिंग',
        'mindmap_desc': 'लिहिण्यापूर्वी विचार दृश्य स्वरूपात व्यवस्थित करा.',
        'mindmap_action': 'मॅप उघडा',
        'grammar_name': 'व्याकरण सहाय्यक',
        'grammar_desc': 'सामान्य डिस्लेक्सिक पॅटर्नसाठी स्मार्ट तपासणी.',
        'grammar_action': 'मजकूर तपासा',
        'memory_title': 'स्मृती सहाय्य',
        'memory_desc': 'सूचना आणि अनुक्रम लक्षात ठेवण्यासाठी धोरणे.',
        'memory_full': 'व्हिज्युअल रिमाइंडर आणि अनुक्रमिक सूचना साधनांसह पुन्हा कधीही काम विसरू नका.',
        'timetable_name': 'व्हिज्युअल टाइमटेबल',
        'timetable_desc': 'चिन्हे आणि रंगांसह तुमच्या दिवसाचे नियोजन करा.',
        'timetable_action': 'शेड्यूल पहा',
        'sequence_name': 'अनुक्रम संशोधक',
        'sequence_desc': 'जटिल पायऱ्या एकाच कामात विभाजित करा.',
        'sequence_action': 'साधे दृश्य',
        'voice_name': 'व्हॉइस नोट्स',
        'voice_desc': 'नंतरसाठी त्वरित ऑडिओ स्मरणपत्रे.',
        'voice_action': 'हिंट रेकॉर्ड करा',
        'focus_title': 'फोकस सपोर्ट',
        'focus_desc': 'विचलितता कमी करण्यासाठी आणि एकाग्रता सुधारण्यासाठी साधने.',
        'focus_full': 'एकाग्रता टिकवून ठेवण्यासाठी डिझाइन केलेल्या साधनांसह शांत शिक्षण वातावरण तयार करा.',
        'pomodoro_name': 'पोमोडोरो टाइमर',
        'pomodoro_desc': 'ठराविक विश्रांतीसह लहान अंतराने काम करा.',
        'pomodoro_action': 'टाइमर सुरू करा',
        'noise_name': 'आवाज मास्किंग',
        'noise_desc': 'विचलित करणारे आवाज रोखण्यासाठी सभोवतालचे संगीत.',
        'noise_action': 'आवाज प्ले करा',
        'limit_name': 'कार्य मर्यादा',
        'limit_desc': 'एका वेळी फक्त एका प्राधान्यावर लक्ष केंद्रित करा.',
        'limit_action': 'ध्येय सेट करा',
        'math_title': 'गणित प्राविण्य',
        'math_desc': 'डिस्कॅकुलिया आणि गणिताशी संबंधित आव्हानांसाठी धोरणे.',
        'math_full': 'व्हिज्युअल गणित साधने आणि व्यावहारिक गणना धोरणांसह संख्यांची भीती दूर करा.',
        'abacus_name': 'व्हिज्युअल अबॅकस',
        'abacus_desc': 'संख्यांना मूर्त वस्तू म्हणून पहा.',
        'abacus_action': 'अबॅकस उघडा',
        'mathbreak_name': 'गणित ब्रेकडाउन',
        'mathbreak_desc': 'मोठ्या भागाकार/समीकरणांसाठी टप्प्याटप्प्याने मार्गदर्शक.',
        'mathbreak_action': 'विश्लेषण करा',
        'symbol_name': 'प्रतीक डिकोडर',
        'symbol_desc': 'जटिल गणितीय चिन्हांचा अर्थ स्पष्ट करा.',
        'symbol_action': 'डिकोड करा',
        'org_title': 'ऑर्गनायझेशन हॅक्स',
        'org_desc': 'तुमचे भौतिक आणि डिजिटल जीवन व्यवस्थित ठेवा.',
        'org_full': 'संरचित संघटन प्रणालीसह तुमची जागा आणि तुमचे मन नीटनेटके करा.',
        'filing_name': 'कलर कोडेड फाइलिंग',
        'filing_desc': 'द्रुत शोधासाठी दस्तऐवज रंगानुसार व्यवस्थित करा.',
        'filing_action': 'गाईड पहा',
        'declutter_name': 'डिजिटल डिक्लटर',
        'declutter_desc': 'साध्या डेस्कटॉप आणि फोल्डर ऑर्गनायझेशन टीपा.',
        'declutter_action': 'सॉर्ट सुरू करा',
        'routine_name': 'रूटीन बिल्डर',
        'routine_desc': 'व्हिज्युअल चेकलिस्टसह सुसंगत सवयी तयार करा.',
        'routine_action': 'सवय तयार करा'
    }
}
# --- Translated Assessment Questions ---
# --- Tailored Assessment Questions ---
ASSESSMENT_QUESTIONS = {
    'student': {
        'en': [
            "Is reading a full page of text very tiring for you?",
            "Do you often confuse left and right directions?",
            "Do you find it hard to learn the times tables?",
            "Is spelling even easy words difficult for you?",
            "Do you skip lines or lose your place while reading?",
            "Is it hard for you to copy notes from a screen or board?",
            "Do you feel that letters 'move' or 'blur' on the page?",
            "Do you prefer to answer questions out loud rather than writing them?",
            "Do you often misread words that look similar (e.g., 'was' and 'saw')?",
            "Do you find it difficult to remember a sequence of instructions?",
            "Do you struggle to finish reading assignments on time?",
            "Do you often find your mind wandering during long reading tasks?"
        ],
        'hi': [
            "क्या टेक्स्ट के पूरे पेज को पढ़ना आपके लिए बहुत थका देने वाला है?",
            "क्या आप अक्सर बाएँ और दाएँ दिशाओं में भ्रमित होते हैं?",
            "क्या आपको पहाड़े (tables) सीखना कठिन लगता है?",
            "क्या आपके लिए आसान शब्दों की स्पेलिंग लिखना भी कठिन है?",
            "क्या आप पढ़ते समय लाइनें छोड़ देते हैं?",
            "क्या आपके लिए स्क्रीन या बोर्ड से नोट्स लेना कठिन है?",
            "क्या आपको लगता है कि पन्ने पर अक्षर 'हिलते' या 'धुंधले' हो जाते हैं?",
            "क्या आप सवालों के जवाब लिखने के बजाय उन्हें बोलकर देना पसंद करते हैं?",
            "क्या आप अक्सर उन शब्दों को गलत पढ़ते हैं जो एक जैसे दिखते हैं (जैसे 'was' और 'saw')?",
            "क्या आपको निर्देशों के क्रम को याद रखना कठिन लगता है?",
            "क्या आप पढ़ने के असाइनमेंट समय पर पूरा करने में संघर्ष करते हैं?",
            "क्या आप अक्सर लंबे समय तक पढ़ने के दौरान अपने मन को भटकते हुए पाते हैं?"
        ],
        'mr': [
            "मजकुराचे पूर्ण पान वाचणे तुमच्यासाठी खूप थकवणारे आहे का?",
            "तुम्ही अनेकदा डाव्या आणि उजव्या दिशांमध्ये गोंधळता का?",
            "तुम्हाला पाढे (tables) पाठ करणे कठीण जाते का?",
            "तुमच्यासाठी सोप्या शब्दांचे स्पेलिंग लिहिणे देखील कठीण आहे का?",
            "वाचताना तुम्ही ओळी सोडता का किंवा तुमची जागा विसरता का?",
            "तुमच्यासाठी स्क्रीन किंवा बोर्डवरून नोट्स काढणे कठीण आहे का?",
            "तुम्हाला पानावरची अक्षरे 'हलतात' किंवा 'अस्पष्ट' होतात असे वाटते का?",
            "तुम्हाला प्रश्नांची उत्तरे लिहिण्यापेक्षा बोलून द्यायला आवडतात का?",
            "तुम्ही सहसा सारखे दिसणारे शब्द चुकीचे वाचता का (उदा. 'was' आणि 'saw')?",
            "तुम्हाला सूचनांचा क्रम लक्षात ठेवणे कठीण जाते का?",
            "तुम्ही वाचनाचे असाइनमेंट वेळेवर पूर्ण करण्यात संघर्ष करता का?",
            "मोठ्या वाचनाच्या वेळी तुमचे मन भरकटलेले तुम्हाला जाणवते का?"
        ]
    },
    'parent': {
        'en': [
            "Does your child avoid reading aloud or get anxious about it?",
            "Does your child struggle to follow multi-step instructions?",
            "Is your child's handwriting often messy or hard to read?",
            "Does your child have difficulty telling time on a clock with hands?",
            "Does your child struggle to express thoughts in structured writing?",
            "Does your child often forget what they have just read?",
            "Is your child frustrated by homework involving a lot of writing?",
            "Does your child excel in creative activities but struggle with phonics?"
        ],
        'hi': [
            "क्या आपका बच्चा जोर से पढ़ने से बचता है या चिंतित हो जाता है?",
            "क्या आपका बच्चा बहु-चरणीय निर्देशों का पालन करने में संघर्ष करता है?",
            "क्या आपके बच्चे की लिखावट अक्सर गंदी या पढ़ने में कठिन होती है?",
            "क्या आपके बच्चे को सुइयों वाली घड़ी पर समय बताने में कठिनाई होती है?",
            "क्या आपका बच्चा संरचित लेखन में अपने विचारों को व्यक्त करने में संघर्ष करता है?",
            "क्या आपका बच्चा अक्सर जो पढ़ा है उसे भूल जाता है?",
            "क्या आपका बच्चा बहुत अधिक लेखन वाले होमवर्क से परेशान हो जाता है?",
            "क्या आपका बच्चा रचनात्मक गतिविधियों में उत्कृष्ट है लेकिन ध्वन्यात्मकता (phonics) में संघर्ष करता है?"
        ],
        'mr': [
            "तुमचा मुलगा मोठ्याने वाचणे टाळतो का किंवा त्याबद्दल काळजीत असतो का?",
            "तुमच्या मुलाला बहु-स्तरीय सूचनांचे पालन करण्यात अडचण येते का?",
            "तुमच्या मुलाचे हस्ताक्षर अनेकदा अस्वच्छ किंवा वाचायला कठीण असते का?",
            "तुमच्या मुलाला घड्याळावर वेळ सांगण्यात अडचण येते का?",
            "तुमचा मुलगा लेखी स्वरूपात विचार व्यक्त करण्यात संघर्ष करतो का?",
            "तुमचा मुलगा अनेकदा जे वाचले आहे ते विसरतो का?",
            "तुमचा मुलगा जास्त लेखन असलेल्या गृहपाठामुळे वैतागतो का?",
            "तुमचा मुलगा सर्जनशील उपक्रमांमध्ये उत्कृष्ट आहे पण फोनीक्समध्ये संघर्ष करतो का?"
        ]
    },
    'teacher': {
        'en': [
            "Does the student perform better in oral tests than written ones?",
            "Does the student often reverse letters or numbers (e.g., 21 for 12)?",
            "Is the student slow to complete reading or copying tasks?",
            "Does the student struggle with phonological awareness (sounds)?",
            "Is the student's organizational ability surprisingly poor for their intellect?",
            "Does the student substitute words with similar meanings while reading?",
            "Is the student easily distracted by visual or auditory noise?",
            "Does the student show unexpected difficulty with basic spelling patterns?"
        ],
        'hi': [
            "क्या छात्र लिखित परीक्षा की तुलना में मौखिक परीक्षा में बेहतर प्रदर्शन करता है?",
            "क्या छात्र अक्सर अक्षरों या संख्याओं को उल्टा लिखता है (जैसे 12 के लिए 21)?",
            "क्या छात्र पढ़ने या नकल करने के कार्यों को पूरा करने में धीमा है?",
            "क्या छात्र ध्वन्यात्मक जागरूकता (ध्वनियों) के साथ संघर्ष करता है?",
            "क्या छात्र की संगठनात्मक क्षमता उनकी बुद्धि के हिसाब से आश्चर्यजनक रूप से खराब है?",
            "क्या छात्र पढ़ते समय समान अर्थ वाले शब्दों को बदलकर पढ़ता है?",
            "क्या छात्र दृश्य या श्रवण शोर से आसानी से विचलित हो जाता है?",
            "क्या छात्र बुनियादी स्पेलिंग पैटर्न के साथ अप्रत्याशित कठिनाई दिखाता है?"
        ],
        'mr': [
            "विद्यार्थी लेखी परीक्षेपेक्षा तोंडी परीक्षेत अधिक चांगली कामगिरी करतो का?",
            "विद्यार्थी अनेकदा अक्षरे किंवा संख्या उलट लिहितो का (उदा. १२ ऐवजी २१)?",
            "विद्यार्थी वाचन किंवा मजकूर उतरवण्याचे काम पूर्ण करण्यास उशीर करतो का?",
            "विद्यार्थ्याला आवाजांच्या ओळखीमध्ये (phonics) अडचण येते का?",
            "विद्यार्थ्याची संघटन क्षमता त्याच्या बुद्धिमत्तेच्या मानाने आश्चर्यकारकपणे कमी आहे का?",
            "वाचताना विद्यार्थी समान अर्थाचे शब्द बदलून वाचतो का?",
            "विद्यार्थी दृश्य किंवा आवाजामुळे सहज विचलित होतो का?",
            "विद्यार्थ्याला मूलभूत स्पेलिंग पॅटर्नमध्ये अनपेक्षित अडचण येते का?"
        ]
    },
    'general': {
        'en': [
            "Do you find it difficult to fill out forms or questionnaires?",
            "Do you rely heavily on auto-correct while typing?",
            "Do you find it hard to navigate using maps or directions?",
            "Do you often find yourself rereading sentences to understand them?",
            "Is it difficult for you to take notes while someone is speaking?",
            "Do you feel your reading speed is significantly slower than others?",
            "Do you struggle to find the right words to express yourself quickly?",
            "Do you find loud environments make it harder to process written information?"
        ],
        'hi': [
            "क्या आपको फॉर्म या प्रश्नावली भरना कठिन लगता है?",
            "क्या आप टाइपिंग करते समय ऑटो-करेक्ट पर बहुत अधिक भरोसा करते हैं?",
            "क्या आपको मैप्स या निर्देशों का उपयोग करके नेविगेट करना कठिन लगता है?",
            "क्या आप अक्सर वाक्यों को समझने के लिए उन्हें बार-बार पढ़ते हैं?",
            "क्या आपके लिए किसी के बोलते समय नोट्स लेना कठिन है?",
            "क्या आपको लगता है कि आपकी पढ़ने की गति दूसरों की तुलना में काफी धीमी है?",
            "क्या आप खुद को जल्दी व्यक्त करने के लिए सही शब्द खोजने में संघर्ष करते हैं?",
            "क्या आपको लगता है कि शोर-शराबे वाले वातावरण में लिखित जानकारी को समझना कठिन हो जाता है?"
        ],
        'mr': [
            "तुम्हाला फॉर्म किंवा प्रश्नावली भरणे कठीण जाते का?",
            "तुम्ही टायपिंग करताना ऑटो-करेक्टवर जास्त अवलंबून असता का?",
            "तुम्हाला नकाशे किंवा दिशा वापरून प्रवास करणे कठीण जाते का?",
            "तुम्ही अनेकदा वाक्ये समजून घेण्यासाठी ती पुन्हा पुन्हा वाचता का?",
            "कोणी बोलत असताना नोट्स घेणे तुमच्यासाठी कठीण आहे का?",
            "तुम्हाला तुमची वाचन गती इतरांपेक्षा लक्षणीयरीत्या कमी वाटते का?",
            "तुम्ही स्वतःला पटकन व्यक्त करण्यासाठी योग्य शब्द शोधण्यात संघर्ष करता का?",
            "तुम्हाला आवाजाच्या वातावरणात लेखी माहिती समजण्यास जास्त त्रास होतो असे वाटते का?"
        ]
    }
}

# --- Detailed Learning Module Data ---
MODULE_DETAILS = {
    'reading': {
        'id': 'reading',
        'title': 'Reading Solutions',
        'icon': '📚',
        'description': 'Techniques to improve reading speed and comprehension.',
        'full_description': 'Our reading tools help overcome visual stress and improve word recognition through science-backed techniques.',
        'strategies': [
            {'name': 'Colored Overlays', 'id': 'overlay-tool', 'desc': 'Digital filters to reduce glare and visual discomfort.', 'action': 'Apply Filter'},
            {'name': 'Guided Reading', 'id': 'guided-tool', 'desc': 'Focus on one line at a time to prevent skipping.', 'action': 'Launch Tool'},
            {'name': 'Dyslexic Fonts', 'id': 'font-tool', 'desc': 'Fonts with weighted bottoms to prevent letter flipping.', 'action': 'Switch Font'}
        ]
    },
    'writing': {
        'id': 'writing',
        'title': 'Writing Support',
        'icon': '✍️',
        'description': 'Tools and tips for better spelling and grammar.',
        'full_description': 'Master the art of expression with tools that handle the mechanics, letting your creativity flow.',
        'strategies': [
            {'name': 'Dictation Tool', 'id': 'dictation-tool', 'desc': 'Convert your voice to text instantly.', 'action': 'Start Recording'},
            {'name': 'Mind Mapping', 'id': 'mindmap-tool', 'desc': 'Organize thoughts visually before writing.', 'action': 'Open Map'},
            {'name': 'Grammar Assistant', 'id': 'grammar-tool', 'desc': 'Smart checks for common dyslexic patterns.', 'action': 'Check Text'}
        ]
    },
    'memory': {
        'id': 'memory',
        'title': 'Memory Aids',
        'icon': '🧠',
        'description': 'Strategies to remember instructions and sequences.',
        'full_description': 'Never lose track of a task again with visual reminders and sequenced instruction tools.',
        'strategies': [
            {'name': 'Visual Timetables', 'id': 'timetable-tool', 'desc': 'Schedule your day with icons and colors.', 'action': 'View Schedule'},
            {'name': 'Sequence Breaker', 'id': 'sequence-tool', 'desc': 'Break complex steps into single tasks.', 'action': 'Simple View'},
            {'name': 'Voice Notes', 'id': 'voice-tool', 'desc': 'Quick audio reminders for later.', 'action': 'Record Hint'}
        ]
    },
    'focus': {
        'id': 'focus',
        'title': 'Focus Support',
        'icon': '🎯',
        'description': 'Tools to minimize distractions and improve concentration.',
        'full_description': 'Create a calm learning environment with tools designed to keep your mind on the task at hand.',
        'strategies': [
            {'name': 'Pomodoro Timer', 'id': 'pomodoro-tool', 'desc': 'Work in short bursts with scheduled breaks.', 'action': 'Start Timer'},
            {'name': 'Noise Masking', 'id': 'noise-tool', 'desc': 'Ambient sounds to block out auditory distractions.', 'action': 'Play Sound'},
            {'name': 'Task Limiter', 'id': 'limit-tool', 'desc': 'Focus on only one priority at a time.', 'action': 'Set Goal'}
        ]
    },
    'math': {
        'id': 'math',
        'title': 'Math Mastering',
        'icon': '🔢',
        'description': 'Strategies for dyscalculia and math-related challenges.',
        'full_description': 'Overcome number anxiety with visual math tools and hands-on calculation strategies.',
        'strategies': [
            {'name': 'Visual Abacus', 'id': 'abacus-tool', 'desc': 'See numbers as tangible objects.', 'action': 'Open Abacus'},
            {'name': 'Math Breakdown', 'id': 'mathbreak-tool', 'desc': 'Step-by-step guides for long division/equations.', 'action': 'Analyze'},
            {'name': 'Symbol Decoder', 'id': 'symbol-tool', 'desc': 'Clarify the meaning of complex math symbols.', 'action': 'Decode'}
        ]
    },
    'org': {
        'id': 'org',
        'title': 'Organization Hacks',
        'icon': '📁',
        'description': 'Keep your physical and digital life in order.',
        'full_description': 'Declutter your space and your mind with structured organization systems.',
        'strategies': [
            {'name': 'Color Coded Filing', 'id': 'filing-tool', 'desc': 'Organize documents by color for quick retrieval.', 'action': 'See Guide'},
            {'name': 'Digital Declutter', 'id': 'declutter-tool', 'desc': 'Simple desktop and folder organization tips.', 'action': 'Start Sort'},
            {'name': 'Routine Builder', 'id': 'routine-tool', 'desc': 'Build consistent habits with visual checklists.', 'action': 'Create Habit'}
        ]
    }
}

# --- Enhanced Suggestions ---
DETAILED_SUGGESTIONS = {
    'reading': [
        "Use the **Colored Overlays** tool in Reading Solutions to reduce visual stress.",
        "Try the **Guided Reading Ruler** to stay focused on one line at a time.",
        "Enable the **Dyslexic Font** in your settings for better letter recognition."
    ],
    'writing': [
        "Practice using the **Dictation Tool** to capture your thoughts without worrying about spelling.",
        "Use **Mind Mapping** to organize your ideas visually before starting to write.",
        "Try a **Grammar Assistant** designed for dyslexic patterns."
    ],
    'memory': [
        "Create a **Visual Timetable** to keep track of your daily routine.",
        "Use the **Sequence Breaker** to divide complex instructions into single steps.",
        "Use **Voice Notes** for quick reminders during your work sessions."
    ],
    'general': [
        "Explore the **Learning Hub** for personalized strategies.",
        "Join a support group to share experiences and tips.",
        "Break large tasks into smaller, manageable chunks."
    ],
    'math': [
        "Use the **Math Breakdown** tool to solve complex arithmetic step-by-step.",
        "Practice counting using the **Visual Abacus** to build a better number sense.",
        "Use the **Symbol Decoder** if you feel confused by math notations."
    ],
    'focus': [
        "Start a **Pomodoro Timer** (25 on, 5 off) to maintain concentration.",
        "Listen to **Noise Masking** or ambient sounds if you get distracted by silence.",
        "Set a single priority goal for each session using the **Task Limiter**."
    ]
}

# --- Global Context Processor for Translations ---
@app.context_processor
def inject_translations():
    lang = session.get('lang', 'en')
    theme = session.get('theme', 'light')
    return {
        't': TRANSLATIONS.get(lang, TRANSLATIONS['en']),
        'current_lang': lang,
        'current_theme': theme
    }

@app.route('/set_lang/<lang>')
def set_lang(lang):
    if lang in TRANSLATIONS:
        session['lang'] = lang
    return redirect(request.referrer or url_for('index'))

@app.route('/toggle_theme')
def toggle_theme():
    current_theme = session.get('theme', 'light')
    session['theme'] = 'dark' if current_theme == 'light' else 'light'
    return redirect(request.referrer or url_for('index'))

# --- Models ---
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class AssessmentResult(db.Model):
    __tablename__ = 'assessment_results'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    score = db.Column(db.Integer, nullable=False)
    interpretation = db.Column(db.String(255))
    details = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# --- Routes ---
@app.route('/')
def index():
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Handle JSON request from React frontend
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                login_user(user)
                return jsonify({
                    'token': 'mock-jwt-token', # Flask uses sessions, but React expects a token
                    'user': {'id': user.id, 'username': user.username, 'email': user.email}
                })
            return jsonify({'error': 'Invalid email or password'}), 401

        # Handle Form request from Flask templates
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid email or password', 'error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            username = data.get('username') or data.get('name') # Support 'name' from React
            email = data.get('email')
            password = data.get('password')
            
            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'Email already registered'}), 409
            
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            return jsonify({
                'token': 'mock-jwt-token',
                'user': {'id': new_user.id, 'username': new_user.username, 'email': new_user.email}
            })

        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
        else:
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful!', 'success')
            return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    results = AssessmentResult.query.filter_by(user_id=current_user.id).order_by(AssessmentResult.created_at.desc()).all()
    return render_template('dashboard.html', results=results)

@app.route('/tools')
def tools():
    return render_template('tools.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/learning')
def learning():
    lang = session.get('lang', 'en')
    t = TRANSLATIONS.get(lang, TRANSLATIONS['en'])
    translated_modules = []
    for m_id, m in MODULE_DETAILS.items():
        tm = m.copy()
        tm['title'] = t.get(f"{m_id}_title", m['title'])
        tm['description'] = t.get(f"{m_id}_desc", m['description'])
        translated_modules.append(tm)
    return render_template('learning.html', modules=translated_modules)

@app.route('/learning/<module_id>')
def learning_detail(module_id):
    lang = session.get('lang', 'en')
    t = TRANSLATIONS.get(lang, TRANSLATIONS['en'])
    module = MODULE_DETAILS.get(module_id)
    if not module:
        return redirect(url_for('learning'))
    
    tm = module.copy()
    tm['title'] = t.get(f"{module_id}_title", module['title'])
    tm['full_description'] = t.get(f"{module_id}_full", module['full_description'])
    
    translated_strategies = []
    for s in module['strategies']:
        ts = s.copy()
        prefix = s['id'].split('-')[0]
        ts['name'] = t.get(f"{prefix}_name", s['name'])
        ts['desc'] = t.get(f"{prefix}_desc", s['desc'])
        ts['action'] = t.get(f"{prefix}_action", s['action'])
        translated_strategies.append(ts)
    tm['strategies'] = translated_strategies
    
    return render_template('learning_detail.html', module=tm)

@app.route('/assessment')
def assessment():
    user_type = request.args.get('type', 'student')
    lang = session.get('lang', 'en')
    
    # Get questions for the specific type and language
    type_questions = ASSESSMENT_QUESTIONS.get(user_type, ASSESSMENT_QUESTIONS['student'])
    questions = type_questions.get(lang, type_questions['en'])
    
    return render_template('assessment.html', questions=questions, user_type=user_type)

@app.route('/api/predict', methods=['POST'])
def predict():
    current_model = get_model()
    if not current_model:
        # Fallback to score-based if model loading fails
        data = request.json
        answers = data.get('answers', [])
        score = sum(1 for a in answers if a)
        prediction = 2 if score >= 8 else (1 if score >= 4 else 0)
    else:
        data = request.json
        answers = data.get('answers', [])
        
        if len(answers) < 12:
            return jsonify({'error': '12 answers required'}), 400
            
        # Mapping for 6 Clinical Features
        feat_accuracy = 1.0 - (( (1 if answers[3] else 0) + (1 if answers[8] else 0) ) / 2.0)
        feat_speed = 1.0 - (( (1 if answers[0] else 0) + (1 if answers[4] else 0) + (1 if answers[10] else 0) ) / 3.0)
        feat_phonological = 1.0 - (( (1 if answers[3] else 0) + (1 if answers[8] else 0) + (1 if answers[1] else 0) ) / 3.0)
        feat_visual = 1.0 - (( (1 if answers[4] else 0) + (1 if answers[6] else 0) ) / 2.0)
        feat_memory = 1.0 - (( (1 if answers[2] else 0) + (1 if answers[9] else 0) ) / 2.0)
        feat_reversals = ( (1 if answers[1] else 0) + (1 if answers[8] else 0) ) / 2.0
        
        features = [feat_accuracy, feat_speed, feat_phonological, feat_visual, feat_memory, feat_reversals]
        
        try:
            prediction = int(current_model.predict([features])[0])
        except:
            score = sum(1 for a in answers if a)
            prediction = 2 if score >= 8 else (1 if score >= 4 else 0)

    # Analysis based on prediction
    
    analysis_map = {
        0: "Minimal indicators of dyslexia detected. Keep up the good work!",
        1: "Possible mild indicators of dyslexia found. Consider exploring our tools.",
        2: "Strong indicators of dyslexia detected. We highly recommend tailored learning strategies."
    }
    
    analysis = analysis_map.get(prediction, "Analysis complete.")
    
    # Select suggestions based on prediction
    suggestions = DETAILED_SUGGESTIONS['general'].copy()
    if prediction >= 1:
        suggestions += DETAILED_SUGGESTIONS['reading']
        suggestions += DETAILED_SUGGESTIONS['writing']
    if prediction == 2:
        suggestions += DETAILED_SUGGESTIONS['memory']

    if current_user.is_authenticated:
        score = sum(features)
        new_result = AssessmentResult(
            user_id=current_user.id,
            score=score,
            interpretation=analysis,
            details=answers
        )
        db.session.add(new_result)
        db.session.commit()
        
    return jsonify({
        'prediction': prediction,
        'analysis': analysis,
        'suggestions': suggestions
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').lower()
    
    # AI specialized knowledge base
    knowledge = {
        'dyslexia': "Dyslexia is a learning difference that primarily affects reading and spelling. It's related to how the brain processes language, not intelligence!",
        'symptoms': "Common symptoms include slow reading, difficulty spelling, and reversing letters. Our screening test can help identify these patterns.",
        'help': "You can help by using multi-sensory learning, text-to-speech tools, and providing a supportive, patient environment.",
        'test': "Our screening test uses clinical features to analyze reading accuracy, speed, and phonological awareness.",
        'tools': "Check out our Tools page for a Reading Ruler, Color Overlays, and specialized Dyslexic Fonts!",
        'hello': "Hello! I'm your Dyslexia Support Assistant. How can I help you today?",
        'hi': "Hi there! Feel free to ask me anything about dyslexia or how to use this platform."
    }
    
    response = "That's a great question! While I'm still learning, I recommend checking our 'About' or 'Learning' sections for more details. Can I help with symptoms or tools?"
    
    for key in knowledge:
        if key in message:
            response = knowledge[key]
            break
            
    return jsonify({'response': response})

@app.route('/user-data')
@login_required
def user_data():
    results = AssessmentResult.query.filter_by(user_id=current_user.id).order_by(AssessmentResult.created_at.desc()).all()
    return jsonify({
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email
        },
        'assessments': [{'score': r.score, 'interpretation': r.interpretation, 'created_at': r.created_at.isoformat()} for r in results]
    })

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.errorhandler(500)
def internal_error(error):
    import traceback
    return f"<h1>Internal Server Error</h1><pre>{traceback.format_exc()}</pre>", 500

# Initialize database on EVERY request to ensure tables exist in ephemeral /tmp
@app.before_request
def initial_db_setup():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
