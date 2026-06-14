import { useState, useEffect, useRef, type DragEvent, type ClipboardEvent } from "react";

type AuthState = "checking" | "login" | "register" | "authenticated";
interface User { email: string; role: string; displayName: string; }

type Lang = "zh" | "en" | "ja" | "fr" | "es" | "pt" | "de" | "it";

interface COPY {
  // Auth screen
  loading: string;
  loginTitle: string;
  loginDesc: string;
  registerTitle: string;
  registerDesc: string;
  email: string;
  displayName: string;
  password: string;
  passwordHint: string;
  processing: string;
  loginBtn: string;
  registerBtn: string;
  noAccount: string;
  goRegister: string;
  hasAccount: string;
  goLogin: string;
  // User bar
  admin: string;
  subscriber: string;
  logout: string;
  // Notices
  pendingNotice: string;
  adminNotice: string;
  // Form labels
  titleLabel: string;
  titlePlaceholder: string;
  folderLabel: string;
  folderPlaceholder: string;
  tagsLabel: string;
  aiTags: string;
  analyzing: string;
  tagsPlaceholder: string;
  summaryLabel: string;
  summaryPlaceholder: string;
  contentLabel: string;
  editTab: string;
  previewTab: string;
  // Toolbar
  h2: string; h2Title: string;
  h3: string; h3Title: string;
  bold: string; boldTitle: string;
  italic: string; italicTitle: string;
  link: string; linkTitle: string; linkPrompt: string;
  image: string; imageTitle: string; imagePrompt: string;
  ul: string; ulTitle: string;
  ol: string; olTitle: string;
  inlineCode: string; inlineCodeTitle: string;
  codeBlock: string; codeBlockTitle: string;
  quote: string; quoteTitle: string;
  callout: string; calloutTitle: string;
  hr: string; hrTitle: string;
  // Textarea
  textareaPlaceholder: string;
  uploading: string;
  dropUpload: string;
  // Help
  cheatsheetTitle: string;
  // Publish button
  publishAdmin: string;
  publishUser: string;
  submitting: string;
  submitted: string;
  // Messages
  successAdmin: string;
  successUser: string;
  errorEmpty: string;
  networkError: string;
  uploadFailed: string;
  uploadUnknown: string;
  loginFailed: string;
  passwordShort: string;
  // Misc
  tagReason: string;
  bidirectionalLink: string;
  imageAlt: string;
  uncategorized: string;
  calloutPlaceholderTitle: string;
  calloutPlaceholderContent: string;
}

const COPY: Record<Lang, COPY> = {
  zh: {
    loading: "加载中...",
    loginTitle: "登录后发布",
    loginDesc: "登录或注册后即可发布文章。",
    registerTitle: "注册账号",
    registerDesc: "注册后即可发布文章，等待管理员审核。",
    email: "邮箱",
    displayName: "昵称",
    password: "密码",
    passwordHint: "至少6个字符",
    processing: "处理中...",
    loginBtn: "登录",
    registerBtn: "注册并登录",
    noAccount: "还没有账号？",
    goRegister: "立即注册",
    hasAccount: "已有账号？",
    goLogin: "去登录",
    admin: "管理员",
    subscriber: "订阅者",
    logout: "退出",
    pendingNotice: "你发布的内容需要管理员审核后才能公开显示。",
    adminNotice: "管理员模式：你的文章将直接发布，无需审核。",
    titleLabel: "标题 *",
    titlePlaceholder: "输入文章标题...",
    folderLabel: "📁 文件夹",
    folderPlaceholder: "如：技术笔记",
    tagsLabel: "🏷️ 标签",
    aiTags: "🤖 AI 智能标签",
    analyzing: "🤖 分析中...",
    tagsPlaceholder: "用逗号分隔，或点 AI 按钮自动生成",
    summaryLabel: "📝 摘要",
    summaryPlaceholder: "简短描述（可选）",
    contentLabel: "📄 正文 *",
    editTab: "编辑",
    previewTab: "预览",
    h2: "标题", h2Title: "二级标题",
    h3: "标题", h3Title: "三级标题",
    bold: "加粗", boldTitle: "加粗 (Ctrl+B)",
    italic: "斜体", italicTitle: "斜体",
    link: "🔗", linkTitle: "插入链接", linkPrompt: "输入链接地址:",
    image: "🖼️", imageTitle: "插入图片URL", imagePrompt: "输入图片地址:",
    ul: "≡", ulTitle: "无序列表",
    ol: "1.", olTitle: "有序列表",
    inlineCode: "<>", inlineCodeTitle: "行内代码",
    codeBlock: "```", codeBlockTitle: "代码块",
    quote: "❝", quoteTitle: "引用",
    callout: "📝", calloutTitle: "Callout 提示块",
    hr: "—", hrTitle: "分割线",
    textareaPlaceholder: "开始写作... 或直接粘贴图片 📷\n\n工具栏已在上方 👆 点击按钮自动插入格式\n\n快捷键：\n- 粘贴截图: Cmd+V（自动上传）\n- 拖拽图片到编辑区（自动上传）",
    uploading: "上传中...",
    dropUpload: "📷 松手即上传图片",
    cheatsheetTitle: "💡 格式速查表（点击展开）",
    publishAdmin: "🚀 直接发布",
    publishUser: "📤 提交审核",
    submitting: "提交中...",
    submitted: "✓ 已提交",
    successAdmin: "文章已直接发布！",
    successUser: "文章已提交审核，管理员审核通过后即可发布。",
    errorEmpty: "标题和内容不能为空。",
    networkError: "网络错误。",
    uploadFailed: "上传失败: ",
    uploadUnknown: "未知错误",
    loginFailed: "登录失败。",
    passwordShort: "密码至少需要6个字符。",
    tagReason: "📊 字中提取",
    bidirectionalLink: "双向链接",
    imageAlt: "图片",
    uncategorized: "未分类",
    calloutPlaceholderTitle: "标题",
    calloutPlaceholderContent: "内容",
  },
  en: {
    loading: "Loading...",
    loginTitle: "Login to publish",
    loginDesc: "Login or register to publish articles.",
    registerTitle: "Register",
    registerDesc: "Register to publish articles, pending admin review.",
    email: "Email",
    displayName: "Display Name",
    password: "Password",
    passwordHint: "At least 6 characters",
    processing: "Processing...",
    loginBtn: "Login",
    registerBtn: "Register & Login",
    noAccount: "No account?",
    goRegister: "Register",
    hasAccount: "Have an account?",
    goLogin: "Login",
    admin: "Admin",
    subscriber: "Subscriber",
    logout: "Logout",
    pendingNotice: "Your content will be reviewed by an admin before being published.",
    adminNotice: "Admin mode: your articles are published directly without review.",
    titleLabel: "Title *",
    titlePlaceholder: "Enter article title...",
    folderLabel: "📁 Folder",
    folderPlaceholder: "e.g. Tech Notes",
    tagsLabel: "🏷️ Tags",
    aiTags: "🤖 AI Tags",
    analyzing: "🤖 Analyzing...",
    tagsPlaceholder: "Separate with commas, or click AI button",
    summaryLabel: "📝 Summary",
    summaryPlaceholder: "Brief description (optional)",
    contentLabel: "📄 Content *",
    editTab: "Edit",
    previewTab: "Preview",
    h2: "H2", h2Title: "Heading 2",
    h3: "H3", h3Title: "Heading 3",
    bold: "B", boldTitle: "Bold (Ctrl+B)",
    italic: "I", italicTitle: "Italic",
    link: "🔗", linkTitle: "Insert link", linkPrompt: "Enter URL:",
    image: "🖼️", imageTitle: "Insert image URL", imagePrompt: "Enter image URL:",
    ul: "≡", ulTitle: "Unordered list",
    ol: "1.", olTitle: "Ordered list",
    inlineCode: "<>", inlineCodeTitle: "Inline code",
    codeBlock: "```", codeBlockTitle: "Code block",
    quote: "❝", quoteTitle: "Quote",
    callout: "📝", calloutTitle: "Callout",
    hr: "—", hrTitle: "Horizontal rule",
    textareaPlaceholder: "Start writing... or paste images 📷\n\nToolbar above 👆 click to insert formatting\n\nShortcuts:\n- Paste screenshot: Cmd+V (auto upload)\n- Drag images to editor (auto upload)",
    uploading: "Uploading...",
    dropUpload: "📷 Drop to upload image",
    cheatsheetTitle: "💡 Formatting Cheatsheet (click to expand)",
    publishAdmin: "🚀 Publish directly",
    publishUser: "📤 Submit for review",
    submitting: "Submitting...",
    submitted: "✓ Submitted",
    successAdmin: "Article published!",
    successUser: "Article submitted for review.",
    errorEmpty: "Title and content are required.",
    networkError: "Network error.",
    uploadFailed: "Upload failed: ",
    uploadUnknown: "Unknown error",
    loginFailed: "Login failed.",
    passwordShort: "Password must be at least 6 characters.",
    tagReason: "📊 Extracted from",
    bidirectionalLink: "Bidirectional Link",
    imageAlt: "image",
    uncategorized: "Uncategorized",
    calloutPlaceholderTitle: "Title",
    calloutPlaceholderContent: "Content",
  },
  ja: {
    loading: "読み込み中...",
    loginTitle: "ログインして投稿",
    loginDesc: "ログインまたは登録して記事を投稿しましょう。",
    registerTitle: "アカウント登録",
    registerDesc: "登録後に記事を投稿でき、管理者の審査待ちになります。",
    email: "メール",
    displayName: "ニックネーム",
    password: "パスワード",
    passwordHint: "6文字以上",
    processing: "処理中...",
    loginBtn: "ログイン",
    registerBtn: "登録してログイン",
    noAccount: "アカウントがありませんか？",
    goRegister: "今すぐ登録",
    hasAccount: "アカウントを持っていますか？",
    goLogin: "ログイン",
    admin: "管理者",
    subscriber: "購読者",
    logout: "ログアウト",
    pendingNotice: "投稿した内容は管理者の審査後に公開されます。",
    adminNotice: "管理者モード：記事は審査なしで直接公開されます。",
    titleLabel: "タイトル *",
    titlePlaceholder: "記事のタイトルを入力...",
    folderLabel: "📁 フォルダ",
    folderPlaceholder: "例：技術ノート",
    tagsLabel: "🏷️ タグ",
    aiTags: "🤖 AI タグ",
    analyzing: "🤖 分析中...",
    tagsPlaceholder: "カンマ区切り、またはAIボタンを押して自動生成",
    summaryLabel: "📝 概要",
    summaryPlaceholder: "簡単な説明（任意）",
    contentLabel: "📄 本文 *",
    editTab: "編集",
    previewTab: "プレビュー",
    h2: "H2", h2Title: "見出し2",
    h3: "H3", h3Title: "見出し3",
    bold: "B", boldTitle: "太字 (Ctrl+B)",
    italic: "I", italicTitle: "斜体",
    link: "🔗", linkTitle: "リンクを挿入", linkPrompt: "URLを入力:",
    image: "🖼️", imageTitle: "画像URLを挿入", imagePrompt: "画像URLを入力:",
    ul: "≡", ulTitle: "箇条書き",
    ol: "1.", olTitle: "番号付きリスト",
    inlineCode: "<>", inlineCodeTitle: "インラインコード",
    codeBlock: "```", codeBlockTitle: "コードブロック",
    quote: "❝", quoteTitle: "引用",
    callout: "📝", calloutTitle: "Callout",
    hr: "—", hrTitle: "水平線",
    textareaPlaceholder: "執筆開始... または画像をペースト 📷\n\n上部のツールバー 👆 クリックでフォーマット挿入\n\nショートカット：\n- スクリーンショットをペースト: Cmd+V（自動アップロード）\n- 画像をドラッグしてエディタに（自動アップロード）",
    uploading: "アップロード中...",
    dropUpload: "📷 ドロップして画像をアップロード",
    cheatsheetTitle: "💡 フォーマット早見表（クリックで展開）",
    publishAdmin: "🚀 直接公開",
    publishUser: "📤 審査に提出",
    submitting: "送信中...",
    submitted: "✓ 送信済み",
    successAdmin: "記事を直接公開しました！",
    successUser: "記事を審査に提出しました。管理者の承認後に公開されます。",
    errorEmpty: "タイトルと内容は必須です。",
    networkError: "ネットワークエラー。",
    uploadFailed: "アップロード失敗: ",
    uploadUnknown: "不明なエラー",
    loginFailed: "ログイン失敗。",
    passwordShort: "パスワードは6文字以上必要です。",
    tagReason: "📊 から抽出",
    bidirectionalLink: "雙方向リンク",
    imageAlt: "画像",
    uncategorized: "未分類",
    calloutPlaceholderTitle: "タイトル",
    calloutPlaceholderContent: "内容",
  },
  fr: {
    loading: "Chargement...",
    loginTitle: "Connectez-vous pour publier",
    loginDesc: "Connectez-vous ou inscrivez-vous pour publier des articles.",
    registerTitle: "S'inscrire",
    registerDesc: "Inscrivez-vous pour publier des articles, en attente de révision.",
    email: "E-mail",
    displayName: "Pseudo",
    password: "Mot de passe",
    passwordHint: "Au moins 6 caractères",
    processing: "Traitement...",
    loginBtn: "Connexion",
    registerBtn: "S'inscrire et se connecter",
    noAccount: "Pas de compte ?",
    goRegister: "S'inscrire",
    hasAccount: "Déjà un compte ?",
    goLogin: "Connexion",
    admin: "Admin",
    subscriber: "Abonné",
    logout: "Déconnexion",
    pendingNotice: "Votre contenu sera examiné par un admin avant publication.",
    adminNotice: "Mode admin : vos articles sont publiés directement sans révision.",
    titleLabel: "Titre *",
    titlePlaceholder: "Entrez le titre de l'article...",
    folderLabel: "📁 Dossier",
    folderPlaceholder: "ex: Notes techniques",
    tagsLabel: "🏷️ Tags",
    aiTags: "🤖 Tags IA",
    analyzing: "🤖 Analyse en cours...",
    tagsPlaceholder: "Séparez par des virgules, ou cliquez sur IA",
    summaryLabel: "📝 Résumé",
    summaryPlaceholder: "Brève description (optionnel)",
    contentLabel: "📄 Contenu *",
    editTab: "Éditer",
    previewTab: "Aperçu",
    h2: "H2", h2Title: "Titre 2",
    h3: "H3", h3Title: "Titre 3",
    bold: "B", boldTitle: "Gras (Ctrl+B)",
    italic: "I", italicTitle: "Italique",
    link: "🔗", linkTitle: "Insérer un lien", linkPrompt: "Entrez l'URL :",
    image: "🖼️", imageTitle: "Insérer une image", imagePrompt: "Entrez l'URL de l'image :",
    ul: "≡", ulTitle: "Liste à puces",
    ol: "1.", olTitle: "Liste numérotée",
    inlineCode: "<>", inlineCodeTitle: "Code en ligne",
    codeBlock: "```", codeBlockTitle: "Bloc de code",
    quote: "❝", quoteTitle: "Citation",
    callout: "📝", calloutTitle: "Bloc Callout",
    hr: "—", hrTitle: "Ligne horizontale",
    textareaPlaceholder: "Commencez à écrire... ou collez des images 📷\n\nBarre d'outils ci-dessus 👆 cliquez pour insérer\n\nRaccourcis :\n- Coller capture: Cmd+V (upload auto)\n- Glisser images dans l'éditeur (upload auto)",
    uploading: "Téléchargement...",
    dropUpload: "📷 Déposez pour uploader l'image",
    cheatsheetTitle: "💡 Aide-mémoire format (cliquez pour展开)",
    publishAdmin: "🚀 Publier directement",
    publishUser: "📤 Soumettre pour révision",
    submitting: "Soumission...",
    submitted: "✓ Soumis",
    successAdmin: "Article publié directement !",
    successUser: "Article soumis pour révision.",
    errorEmpty: "Titre et contenu requis.",
    networkError: "Erreur réseau.",
    uploadFailed: "Échec upload : ",
    uploadUnknown: "Erreur inconnue",
    loginFailed: "Échec connexion.",
    passwordShort: "Le mot de passe doit contenir au moins 6 caractères.",
    tagReason: "📊 Extrait de",
    bidirectionalLink: "Lien bidirectionnel",
    imageAlt: "image",
    uncategorized: "Non classé",
    calloutPlaceholderTitle: "Titre",
    calloutPlaceholderContent: "Contenu",
  },
  es: {
    loading: "Cargando...",
    loginTitle: "Inicia sesión para publicar",
    loginDesc: "Inicia sesión o regístrate para publicar artículos.",
    registerTitle: "Registrarse",
    registerDesc: "Regístrate para publicar artículos, pendiente de revisión.",
    email: "Correo",
    displayName: "Nombre",
    password: "Contraseña",
    passwordHint: "Al menos 6 caracteres",
    processing: "Procesando...",
    loginBtn: "Iniciar sesión",
    registerBtn: "Registrarse e iniciar",
    noAccount: "¿No tienes cuenta?",
    goRegister: "Regístrate",
    hasAccount: "¿Ya tienes cuenta?",
    goLogin: "Iniciar sesión",
    admin: "Admin",
    subscriber: "Suscriptor",
    logout: "Salir",
    pendingNotice: "Tu contenido será revisado por un admin antes de publicarse.",
    adminNotice: "Modo admin: tus artículos se publican directamente sin revisión.",
    titleLabel: "Título *",
    titlePlaceholder: "Ingresa el título del artículo...",
    folderLabel: "📁 Carpeta",
    folderPlaceholder: "ej: Notas técnicas",
    tagsLabel: "🏷️ Etiquetas",
    aiTags: "🤖 Tags IA",
    analyzing: "🤖 Analizando...",
    tagsPlaceholder: "Separa con comas, o usa el botón IA",
    summaryLabel: "📝 Resumen",
    summaryPlaceholder: "Descripción breve (opcional)",
    contentLabel: "📄 Contenido *",
    editTab: "Editar",
    previewTab: "Vista previa",
    h2: "H2", h2Title: "Título 2",
    h3: "H3", h3Title: "Título 3",
    bold: "B", boldTitle: "Negrita (Ctrl+B)",
    italic: "I", italicTitle: "Cursiva",
    link: "🔗", linkTitle: "Insertar enlace", linkPrompt: "Ingresa URL:",
    image: "🖼️", imageTitle: "Insertar imagen", imagePrompt: "Ingresa URL de imagen:",
    ul: "≡", ulTitle: "Lista",
    ol: "1.", olTitle: "Lista numerada",
    inlineCode: "<>", inlineCodeTitle: "Código en línea",
    codeBlock: "```", codeBlockTitle: "Bloque de código",
    quote: "❝", quoteTitle: "Cita",
    callout: "📝", calloutTitle: "Bloque Callout",
    hr: "—", hrTitle: "Línea horizontal",
    textareaPlaceholder: "Empieza a escribir... o pega imágenes 📷\n\nBarra de herramientas arriba 👆 haz clic para insertar\n\nAtajos :\n- Pegar captura: Cmd+V (subida auto)\n- Arrastrar imágenes al editor (subida auto)",
    uploading: "Subiendo...",
    dropUpload: "📷 Suelta para subir imagen",
    cheatsheetTitle: "💡 Hoja de ayuda de formato (clic para expandir)",
    publishAdmin: "🚀 Publicar directamente",
    publishUser: "📤 Enviar para revisión",
    submitting: "Enviando...",
    submitted: "✓ Enviado",
    successAdmin: "¡Artículo publicado directamente!",
    successUser: "Artículo enviado para revisión.",
    errorEmpty: "Título y contenido requeridos.",
    networkError: "Error de red.",
    uploadFailed: "Error de subida: ",
    uploadUnknown: "Error desconocido",
    loginFailed: "Error de login.",
    passwordShort: "La contraseña debe tener al menos 6 caracteres.",
    tagReason: "📊 Extraído de",
    bidirectionalLink: "Link bidirecional",
    imageAlt: "imagen",
    uncategorized: "Sin categoría",
    calloutPlaceholderTitle: "Título",
    calloutPlaceholderContent: "Contenido",
  },
  pt: {
    loading: "Carregando...",
    loginTitle: "Entre para publicar",
    loginDesc: "Entre ou registre-se para publicar artigos.",
    registerTitle: "Registrar",
    registerDesc: "Registre-se para publicar artigos, pendente de revisão.",
    email: "E-mail",
    displayName: "Nome",
    password: "Senha",
    passwordHint: "Pelo menos 6 caracteres",
    processing: "Processando...",
    loginBtn: "Entrar",
    registerBtn: "Registrar e entrar",
    noAccount: "Sem conta?",
    goRegister: "Registre-se",
    hasAccount: "Já tem conta?",
    goLogin: "Entrar",
    admin: "Admin",
    subscriber: "Assinante",
    logout: "Sair",
    pendingNotice: "Seu conteúdo será revisado por um admin antes de publicar.",
    adminNotice: "Modo admin: seus artigos são publicados diretamente sem revisão.",
    titleLabel: "Título *",
    titlePlaceholder: "Digite o título do artigo...",
    folderLabel: "📁 Pasta",
    folderPlaceholder: "ex: Notas técnicas",
    tagsLabel: "🏷️ Tags",
    aiTags: "🤖 Tags IA",
    analyzing: "🤖 Analisando...",
    tagsPlaceholder: "Separe com vírgulas, ou clique em IA",
    summaryLabel: "📝 Resumo",
    summaryPlaceholder: "Breve descrição (opcional)",
    contentLabel: "📄 Conteúdo *",
    editTab: "Editar",
    previewTab: "Pré-visualizar",
    h2: "H2", h2Title: "Título 2",
    h3: "H3", h3Title: "Título 3",
    bold: "B", boldTitle: "Negrito (Ctrl+B)",
    italic: "I", italicTitle: "Itálico",
    link: "🔗", linkTitle: "Inserir link", linkPrompt: "Digite a URL:",
    image: "🖼️", imageTitle: "Inserir imagem", imagePrompt: "Digite URL da imagem:",
    ul: "≡", ulTitle: "Lista",
    ol: "1.", olTitle: "Lista numerada",
    inlineCode: "<>", inlineCodeTitle: "Código inline",
    codeBlock: "```", codeBlockTitle: "Bloco de código",
    quote: "❝", quoteTitle: "Citação",
    callout: "📝", calloutTitle: "Bloco Callout",
    hr: "—", hrTitle: "Linha horizontal",
    textareaPlaceholder: "Comece a escrever... ou cole imagens 📷\n\nBarra de ferramentas acima 👆 clique para inserir\n\nAtalhos :\n- Colar captura: Cmd+V (upload auto)\n- Arrastar imagens para o editor (upload auto)",
    uploading: "Enviando...",
    dropUpload: "📷 Solte para enviar imagem",
    cheatsheetTitle: "💡 Ajuda de formatação (clique para expandir)",
    publishAdmin: "🚀 Publicar diretamente",
    publishUser: "📤 Enviar para revisão",
    submitting: "Enviando...",
    submitted: "✓ Enviado",
    successAdmin: "Artigo publicado diretamente!",
    successUser: "Artigo enviado para revisão.",
    errorEmpty: "Título e conteúdo são obrigatórios.",
    networkError: "Erro de rede.",
    uploadFailed: "Falha no envio: ",
    uploadUnknown: "Erro desconhecido",
    loginFailed: "Falha no login.",
    passwordShort: "A senha deve ter pelo menos 6 caracteres.",
    tagReason: "📊 Extraído de",
    bidirectionalLink: "Link bidirecional",
    imageAlt: "imagem",
    uncategorized: "Sem categoria",
    calloutPlaceholderTitle: "Título",
    calloutPlaceholderContent: "Conteúdo",
  },
  de: {
    loading: "Laden...",
    loginTitle: "Anmelden zum Veröffentlichen",
    loginDesc: "Melden Sie sich an oder registrieren Sie sich, um Artikel zu veröffentlichen.",
    registerTitle: "Registrieren",
    registerDesc: "Registrieren Sie sich, um Artikel zu veröffentlichen — nach Admin-Prüfung.",
    email: "E-Mail",
    displayName: "Anzeigename",
    password: "Passwort",
    passwordHint: "Mindestens 6 Zeichen",
    processing: "Verarbeitung...",
    loginBtn: "Anmelden",
    registerBtn: "Registrieren & Anmelden",
    noAccount: "Kein Konto?",
    goRegister: "Jetzt registrieren",
    hasAccount: "Haben Sie ein Konto?",
    goLogin: "Anmelden",
    admin: "Admin",
    subscriber: "Abonnent",
    logout: "Abmelden",
    pendingNotice: "Ihr Inhalt wird vor der Veröffentlichung von einem Admin geprüft.",
    adminNotice: "Admin-Modus: Ihre Artikel werden direkt ohne Prüfung veröffentlicht.",
    titleLabel: "Titel *",
    titlePlaceholder: "Artikeltitel eingeben...",
    folderLabel: "📁 Ordner",
    folderPlaceholder: "z.B. Tech-Notizen",
    tagsLabel: "🏷️ Tags",
    aiTags: "🤖 KI-Tags",
    analyzing: "🤖 Analysiere...",
    tagsPlaceholder: "Mit Kommas trennen, oder KI-Button klicken",
    summaryLabel: "📝 Zusammenfassung",
    summaryPlaceholder: "Kurze Beschreibung (optional)",
    contentLabel: "📄 Inhalt *",
    editTab: "Bearbeiten",
    previewTab: "Vorschau",
    h2: "H2", h2Title: "Überschrift 2",
    h3: "H3", h3Title: "Überschrift 3",
    bold: "B", boldTitle: "Fett (Ctrl+B)",
    italic: "I", italicTitle: "Kursiv",
    link: "🔗", linkTitle: "Link einfügen", linkPrompt: "URL eingeben:",
    image: "🖼️", imageTitle: "Bild-URL einfügen", imagePrompt: "Bild-URL eingeben:",
    ul: "≡", ulTitle: "Aufzählung",
    ol: "1.", olTitle: "Nummerierte Liste",
    inlineCode: "<>", inlineCodeTitle: "Inline-Code",
    codeBlock: "```", codeBlockTitle: "Codeblock",
    quote: "❝", quoteTitle: "Zitat",
    callout: "📝", calloutTitle: "Callout-Hinweis",
    hr: "—", hrTitle: "Trennlinie",
    textareaPlaceholder: "Schreiben Sie... oder fügen Sie Bilder ein 📷\n\nWerkzeugleiste oben 👆 klicken zum Einfügen\n\nTastenkürzel:\n- Screenshot einfügen: Cmd+V (Auto-Upload)\n- Bilder in Editor ziehen (Auto-Upload)",
    uploading: "Upload...",
    dropUpload: "📷 Loslassen zum Bild-Upload",
    cheatsheetTitle: "💡 Formatierungs-Hilfe (klicken zum Erweitern)",
    publishAdmin: "🚀 Direkt veröffentlichen",
    publishUser: "📤 Zur Prüfung einreichen",
    submitting: "Wird gesendet...",
    submitted: "✓ Gesendet",
    successAdmin: "Artikel direkt veröffentlicht!",
    successUser: "Artikel zur Prüfung eingereicht.",
    errorEmpty: "Titel und Inhalt sind erforderlich.",
    networkError: "Netzwerkfehler.",
    uploadFailed: "Upload fehlgeschlagen: ",
    uploadUnknown: "Unbekannter Fehler",
    loginFailed: "Login fehlgeschlagen.",
    passwordShort: "Das Passwort muss mindestens 6 Zeichen haben.",
    tagReason: "📊 Extrahiert aus",
    bidirectionalLink: "Bidirektionaler Link",
    imageAlt: "Bild",
    uncategorized: "Nicht kategorisiert",
    calloutPlaceholderTitle: "Titel",
    calloutPlaceholderContent: "Inhalt",
  },
  it: {
    loading: "Caricamento...",
    loginTitle: "Accedi per pubblicare",
    loginDesc: "Accedi o registrati per pubblicare articoli.",
    registerTitle: "Registrati",
    registerDesc: "Registrati per pubblicare articoli, in attesa di revisione.",
    email: "Email",
    displayName: "Nome",
    password: "Password",
    passwordHint: "Almeno 6 caratteri",
    processing: "Elaborazione...",
    loginBtn: "Accedi",
    registerBtn: "Registrati e accedi",
    noAccount: "Non hai un account?",
    goRegister: "Registrati ora",
    hasAccount: "Hai già un account?",
    goLogin: "Accedi",
    admin: "Admin",
    subscriber: "Abbonato",
    logout: "Esci",
    pendingNotice: "Il tuo contenuto sarà esaminato da un admin prima della pubblicazione.",
    adminNotice: "Modalità admin: i tuoi articoli vengono pubblicati direttamente senza revisione.",
    titleLabel: "Titolo *",
    titlePlaceholder: "Inserisci il titolo dell'articolo...",
    folderLabel: "📁 Cartella",
    folderPlaceholder: "es: Note tecniche",
    tagsLabel: "🏷️ Tag",
    aiTags: "🤖 Tag IA",
    analyzing: "🤖 Analisi in corso...",
    tagsPlaceholder: "Separa con virgole, o clicca su IA",
    summaryLabel: "📝 Sommario",
    summaryPlaceholder: "Breve descrizione (opzionale)",
    contentLabel: "📄 Contenuto *",
    editTab: "Modifica",
    previewTab: "Anteprima",
    h2: "H2", h2Title: "Titolo 2",
    h3: "H3", h3Title: "Titolo 3",
    bold: "B", boldTitle: "Grassetto (Ctrl+B)",
    italic: "I", italicTitle: "Corsivo",
    link: "🔗", linkTitle: "Inserisci link", linkPrompt: "Inserisci URL:",
    image: "🖼️", imageTitle: "Inserisci URL immagine", imagePrompt: "Inserisci URL immagine:",
    ul: "≡", ulTitle: "Elenco puntato",
    ol: "1.", olTitle: "Elenco numerato",
    inlineCode: "<>", inlineCodeTitle: "Codice inline",
    codeBlock: "```", codeBlockTitle: "Blocco di codice",
    quote: "❝", quoteTitle: "Citazione",
    callout: "📝", calloutTitle: "Blocco Callout",
    hr: "—", hrTitle: "Linea orizzontale",
    textareaPlaceholder: "Inizia a scrivere... o incolla immagini 📷\n\nBarra strumenti sopra 👆 clicca per inserire\n\nScorciatoie:\n- Incolla screenshot: Cmd+V (upload auto)\n- Trascina immagini nell'editor (upload auto)",
    uploading: "Caricamento...",
    dropUpload: "📷 Rilascia per caricare immagine",
    cheatsheetTitle: "💡 Guida rapida formattazione (clicca per espandere)",
    publishAdmin: "🚀 Pubblica direttamente",
    publishUser: "📤 Invia per revisione",
    submitting: "Invio...",
    submitted: "✓ Inviato",
    successAdmin: "Articolo pubblicato direttamente!",
    successUser: "Articolo inviato per revisione.",
    errorEmpty: "Titolo e contenuto sono obbligatori.",
    networkError: "Errore di rete.",
    uploadFailed: "Upload fallito: ",
    uploadUnknown: "Errore sconosciuto",
    loginFailed: "Login fallito.",
    passwordShort: "La password deve avere almeno 6 caratteri.",
    tagReason: "📊 Estratto da",
    bidirectionalLink: "Collegamento bidirezionale",
    imageAlt: "immagine",
    uncategorized: "Senza categoria",
    calloutPlaceholderTitle: "Titolo",
    calloutPlaceholderContent: "Contenuto",
  },
};

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const s = localStorage.getItem("lookfinde_lang");
  const all: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
  return all.includes(s as Lang) ? (s as Lang) : "zh";
}

export default function PublishEditor() {
  // Auth
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Editor
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tagReason, setTagReason] = useState("");

  // Language — also used as the source language for writing (auto-detected from UI)
  const [lang, setLang] = useState<Lang>("zh");

  // Sync language
  useEffect(() => {
    const stored = getStoredLang();
    setLang(stored);
    const handler = () => {
      const current = (window as any).__i18n?.language;
      const all: Lang[] = ["zh", "en", "ja", "fr", "es", "pt", "de", "it"];
      if (current && all.includes(current)) setLang(current as Lang);
    };
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);

  // Load article for editing (if ?edit=id is in URL)
  const [editId, setEditId] = useState<string | null>(null);

  // Check stored token
  useEffect(() => {
    const stored = localStorage.getItem("lookfinde_token");
    stored ? checkToken(stored) : setAuthState("login");
    // Check for edit mode
    const params = new URLSearchParams(window.location.search);
    const editParam = params.get("edit");
    if (editParam) setEditId(editParam);
  }, []);

  // Load article data for editing
  useEffect(() => {
    if (!editId || authState !== "authenticated") return;
    fetch(`/api/articles/public`)
      .then(r => r.json())
      .then(articles => {
        const a = articles.find((a: any) => a.id === editId);
        if (a) {
          setTitle(a.title || "");
          setContent(a.content || "");
          setSummary(a.summary || "");
          setFolder(a.folder || "");
          setTags((a.tags || []).join(", "));
          if (a.sourceLang) setLang(a.sourceLang);
        }
      })
      .catch(() => {});
  }, [editId, authState]);

  const checkToken = async (t: string) => {
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) { const u = await res.json(); setUser(u); setToken(t); setAuthState("authenticated"); }
      else { localStorage.removeItem("lookfinde_token"); setAuthState("login"); }
    } catch { setAuthState("login"); }
  };

  const c = COPY[lang];

  const handleLogin = async () => {
    setAuthError(""); setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem("lookfinde_token", data.token); setToken(data.token); setUser(data.user); setAuthState("authenticated"); }
      else setAuthError(data.error || c.loginFailed);
    } catch { setAuthError(c.networkError); }
    setAuthLoading(false);
  };

  const handleRegister = async () => {
    setAuthError("");
    if (password.length < 6) { setAuthError(c.passwordShort); return; }
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, displayName }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem("lookfinde_token", data.token); setToken(data.token); setUser(data.user); setAuthState("authenticated"); }
      else setAuthError(data.error || c.loginFailed);
    } catch { setAuthError(c.networkError); }
    setAuthLoading(false);
  };

  /* ── Toolbar actions ── */
  const insertMarkdown = (before: string, after = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = before + selected + after;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const toolbarActions = [
    { label: c.h2, icon: "H2", title: c.h2Title, action: () => insertMarkdown("\n## ") },
    { label: c.h3, icon: "H3", title: c.h3Title, action: () => insertMarkdown("\n### ") },
    { label: c.bold, icon: "B", title: c.boldTitle, action: () => insertMarkdown("**", "**") },
    { label: c.italic, icon: "I", title: c.italicTitle, action: () => insertMarkdown("*", "*") },
    { label: c.link, icon: "🔗", title: c.linkTitle, action: () => {
      const url = prompt(c.linkPrompt, "https://");
      if (url) insertMarkdown("[", `](${url})`);
    }},
    { label: c.image, icon: "🖼️", title: c.imageTitle, action: () => {
      const url = prompt(c.imagePrompt, "https://");
      if (url) insertMarkdown(`\n![${c.imageAlt}](${url})\n`);
    }},
    { label: c.ul, icon: "≡", title: c.ulTitle, action: () => insertMarkdown("\n- ") },
    { label: c.ol, icon: "1.", title: c.olTitle, action: () => insertMarkdown("\n1. ") },
    { label: c.inlineCode, icon: "<>", title: c.inlineCodeTitle, action: () => insertMarkdown("`", "`") },
    { label: c.codeBlock, icon: "```", title: c.codeBlockTitle, action: () => insertMarkdown("\n```\n", "\n```\n") },
    { label: c.quote, icon: "❝", title: c.quoteTitle, action: () => insertMarkdown("\n> ") },
    { label: c.callout, icon: "📝", title: c.calloutTitle, action: () => insertMarkdown(`\n> [!note] ${c.calloutPlaceholderTitle}\n> ${c.calloutPlaceholderContent}\n`) },
    { label: c.hr, icon: "—", title: c.hrTitle, action: () => insertMarkdown("\n---\n") },
  ];

  /* ── Image upload ── */
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.url) {
        insertMarkdown(`\n![${file.name}](${data.url})\n`);
      } else {
        alert(c.uploadFailed + (data.error || c.uploadUnknown));
      }
    } catch {
      alert(c.uploadFailed + c.networkError);
    }
    setUploading(false);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadImage(file);
        return;
      }
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        uploadImage(file);
        return;
      }
    }
  };

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  /* ── AI Tag Analysis ── */
  const analyzeTags = async () => {
    if (!content.trim()) return;
    setAnalyzing(true);
    setTagReason("");
    try {
      const res = await fetch("/api/analyze-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.tags?.length) {
        setTags(data.tags.join(", "));
        setTagReason(c.tagReason + ` ${data.tags.length} ${data.reasoning || ""}`);
      }
    } catch {
      // silent fail
    }
    setAnalyzing(false);
  };

  /* ── Publish / Update ── */
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) { setStatus("error"); setMessage(c.errorEmpty); return; }
    setStatus("loading");
    try {
      const url = editId ? "/api/articles/update" : "/api/publish";
      const method = editId ? "PUT" : "POST";
      const body: any = { title: title.trim(), folder: folder.trim() || c.uncategorized, tags: tags.split(",").map(t => t.trim()).filter(Boolean), summary: summary.trim(), content: content.trim(), sourceLang: lang };
      if (editId) body.articleId = editId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setStatus(data.success ? "success" : "error");
      setMessage(data.success
        ? (editId ? "文章已更新！" : (user?.role === "admin" ? c.successAdmin : c.successUser))
        : (data.message || data.error || c.networkError));
      if (data.success && user?.role === "admin" && !editId) { setTitle(""); setFolder(""); setTags(""); setSummary(""); setContent(""); }
    } catch { setStatus("error"); setMessage(c.networkError); }
  };

  const inputStyle: React.CSSProperties = {
    minHeight: 48, background: "var(--color-bg)", borderColor: "var(--color-border)",
    color: "var(--color-text)", "--tw-ring-color": "var(--color-ring)",
  } as React.CSSProperties;

  /* ── Auth screens ── */
  if (authState === "checking") return <div className="text-center py-12"><p style={{ color: "var(--color-text-muted)" }}>{c.loading}</p></div>;

  if (authState === "login" || authState === "register") {
    const isLogin = authState === "login";
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl p-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-md)" }}>
          <h2 className="text-xl font-bold mb-2">{isLogin ? "🔐 " + c.loginTitle : "📝 " + c.registerTitle}</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>{isLogin ? c.loginDesc : c.registerDesc}</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>{c.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2" style={inputStyle} />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>{c.displayName}</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={c.displayName} className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2" style={inputStyle} />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>{c.password}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={c.passwordHint} onKeyDown={e => e.key === "Enter" && (isLogin ? handleLogin() : handleRegister())} className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2" style={inputStyle} />
            </div>
            {authError && <p className="text-sm font-medium" style={{ color: "#ef4444" }}>{authError}</p>}
            <button onClick={isLogin ? handleLogin : handleRegister} disabled={authLoading} className="w-full rounded-xl font-semibold text-white py-3.5 transition-all disabled:opacity-60 shadow-lg" style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", border: "none", cursor: authLoading ? "wait" : "pointer", fontSize: "1rem", minHeight: 48 }}>
              {authLoading ? c.processing : isLogin ? c.loginBtn : c.registerBtn}
            </button>
            <p className="text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              {isLogin ? c.noAccount : c.hasAccount}
              <button onClick={() => { setAuthState(isLogin ? "register" : "login"); setAuthError(""); }} className="font-semibold ml-1" style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", minHeight: 32 }}>
                {isLogin ? c.goRegister : c.goLogin}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Authenticated: Editor ── */
  return (
    <div className="space-y-5">
      {/* User bar */}
      <div className="flex items-center justify-between rounded-xl p-3 px-4" style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5" style={{ background: user?.role === "admin" ? "var(--color-accent-light)" : "var(--color-primary-light)", color: user?.role === "admin" ? "var(--color-accent)" : "var(--color-primary)" }}>
            {user?.role === "admin" ? c.admin : c.subscriber}
          </span>
          <span style={{ color: "var(--color-text-secondary)" }}>{user?.email}</span>
        </div>
        <button onClick={() => { localStorage.removeItem("lookfinde_token"); setAuthState("login"); setUser(null); setToken(""); }} className="text-xs font-medium rounded-lg px-3 py-1.5 transition-colors" style={{ background: "transparent", color: "var(--color-text-muted)", border: "none", cursor: "pointer", minHeight: 32 }}>
          {c.logout}
        </button>
      </div>

      {user?.role !== "admin" && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e" }}>
          📝 {c.pendingNotice}
        </div>
      )}
      {user?.role === "admin" && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534" }}>
          🛡️ {c.adminNotice}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>{c.titleLabel}</label>
        <input type="text" value={title} maxLength={20} onChange={e => setTitle(e.target.value.slice(0, 20))} placeholder={c.titlePlaceholder} className="w-full rounded-xl border px-4 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
        <p className="text-xs mt-1" style={{ color: title.length >= 20 ? "#ef4444" : "var(--color-text-muted)" }}>{title.length}/20 字</p>
      </div>

      {/* Folder + Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>{c.folderLabel}</label>
          <input type="text" value={folder} onChange={e => setFolder(e.target.value)} placeholder={c.folderPlaceholder} className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{c.tagsLabel}</label>
            <button
              type="button"
              onClick={analyzeTags}
              disabled={analyzing || !content.trim()}
              className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-3 py-1 transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                border: "none",
                cursor: analyzing ? "wait" : "pointer",
                minHeight: 28,
              }}
            >
              {analyzing ? c.analyzing : c.aiTags}
            </button>
          </div>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder={c.tagsPlaceholder} className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
          {tagReason && (
            <p className="text-xs mt-1.5 px-1" style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              {c.tagReason}
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>{c.summaryLabel}</label>
        <input type="text" value={summary} maxLength={50} onChange={e => setSummary(e.target.value.slice(0, 50))} placeholder={c.summaryPlaceholder} className="w-full rounded-xl border px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:border-transparent" style={inputStyle} />
        <p className="text-xs mt-1" style={{ color: summary.length >= 50 ? "#ef4444" : "var(--color-text-muted)" }}>{summary.length}/50 字</p>
      </div>

      {/* ── Editor with toolbar ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{c.contentLabel}</label>
          <div className="flex-1" />
          <button type="button" onClick={() => setShowPreview(false)} className="editor-tab-btn" style={{ background: !showPreview ? "var(--color-primary-light)" : "transparent", color: !showPreview ? "var(--color-primary)" : "var(--color-text-muted)" }}>{c.editTab}</button>
          <button type="button" onClick={() => setShowPreview(true)} className="editor-tab-btn" style={{ background: showPreview ? "var(--color-primary-light)" : "transparent", color: showPreview ? "var(--color-primary)" : "var(--color-text-muted)" }}>{c.previewTab}</button>
        </div>

        {showPreview ? (
          <div className="w-full rounded-xl border p-5 min-h-[300px] text-base leading-relaxed" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {content || <span style={{ color: "var(--color-text-muted)" }}>{c.textareaPlaceholder.split("\n")[0]}</span>}
          </div>
        ) : (
          <>
            {/* Formatting toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-t-xl border border-b-0" style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
              {toolbarActions.map((btn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={btn.action}
                  title={btn.title}
                  className="toolbar-btn"
                  style={{
                    minHeight: 32, minWidth: 32, padding: "0.25rem 0.5rem",
                    fontWeight: btn.icon === "B" ? 700 : btn.icon === "I" ? undefined : 600,
                    fontStyle: btn.icon === "I" ? "italic" : undefined,
                    fontSize: btn.icon.length > 2 ? "0.7rem" : "0.8rem",
                    background: "transparent", color: "var(--color-text-secondary)",
                    border: "none", borderRadius: "6px", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-tertiary)"; e.currentTarget.style.color = "var(--color-text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                >
                  {btn.icon}
                </button>
              ))}
              {uploading && <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>{c.uploading}</span>}
            </div>

            {/* Textarea with drop zone */}
            <div ref={dropZoneRef} style={{ position: "relative" }}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onPaste={handlePaste}
                placeholder={c.textareaPlaceholder}
                rows={18}
                className="w-full rounded-b-xl border px-4 py-4 transition-all focus:outline-none focus:ring-2 focus:border-transparent resize-y"
                style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "0.9rem", lineHeight: 1.8, minHeight: 320, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
              />
              {/* Drag overlay */}
              {dragOver && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className="absolute inset-0 flex items-center justify-center rounded-b-xl"
                  style={{ background: "rgba(99,102,241,0.08)", border: "2px dashed var(--color-primary)", zIndex: 10 }}
                >
                  <span className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>{c.dropUpload}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Quick help */}
      <details className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)" }}>
        <summary className="text-sm font-semibold cursor-pointer select-none" style={{ color: "var(--color-text)", minHeight: 36, display: "flex", alignItems: "center" }}>
          {c.cheatsheetTitle}
        </summary>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs" style={{ color: "var(--color-text-secondary)", lineHeight: 1.8 }}>
          <div><code className="help-code">**文字**</code> <strong>{c.bold}</strong></div>
          <div><code className="help-code">*文字*</code> <em>{c.italic}</em></div>
          <div><code className="help-code">## 标题</code> {c.h2Title}</div>
          <div><code className="help-code">[文字](url)</code> {c.linkTitle}</div>
          <div><code className="help-code">![图](url)</code> {c.imageTitle}</div>
          <div><code className="help-code">- 项目</code> {c.ulTitle}</div>
          <div><code className="help-code">1. 项目</code> {c.olTitle}</div>
          <div><code className="help-code">{"> [!note]"}</code> {c.calloutTitle}</div>
          <div><code className="help-code">{"> 引用"}</code> {c.quoteTitle}</div>
          <div><code className="help-code">--- </code> {c.hrTitle}</div>
          <div><code className="help-code">[[笔记]]</code>{c.bidirectionalLink}</div>
          <div><code className="help-code">```code```</code> {c.inlineCodeTitle}</div>
        </div>
      </details>

      {/* Publish */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handlePublish}
          disabled={status === "loading"}
          className="flex items-center gap-2 rounded-full font-semibold text-white px-8 py-3.5 shadow-lg transition-all disabled:opacity-60"
          style={{ background: status === "success" ? "#10b981" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", border: "none", cursor: status === "loading" ? "wait" : "pointer", fontSize: "1.05rem", minHeight: 48 }}
        >
          {status === "loading" ? c.submitting : status === "success" ? c.submitted : (editId ? "✏️ 更新文章" : (user?.role === "admin" ? c.publishAdmin : c.publishUser))}
        </button>
        {message && <span className="text-sm font-medium" style={{ color: status === "success" ? "#10b981" : "#ef4444" }}>{message}</span>}
      </div>
    </div>
  );
}