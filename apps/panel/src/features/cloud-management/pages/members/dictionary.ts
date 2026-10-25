/* The Members page's own copy, kept beside it rather than in the shell's
   table. The page is large and its wording is all its own, so a local
   dictionary keeps it readable and keeps 80-odd keys out of a table shared
   by the whole panel. Same shape as PanelHome's. */

export type Lang = "en" | "ar" | "fa";

export const D: Record<string, Record<Lang, string>> = {
  // Page chrome
  members: { en: "Members", ar: "الأعضاء", fa: "اعضا" },
  inviteMember: { en: "Invite Member", ar: "دعوة عضو", fa: "دعوت عضو" },
  newRole: { en: "New Role", ar: "دور جديد", fa: "نقش جدید" },

  // Tabs
  tabMembers: { en: "Members", ar: "الأعضاء", fa: "اعضا" },
  tabRoles: { en: "Roles & Access", ar: "الأدوار والوصول", fa: "نقش‌ها و دسترسی" },
  tabInvitations: { en: "Invitations", ar: "الدعوات", fa: "دعوت‌نامه‌ها" },

  // Members table
  searchMembers: { en: "Search in members", ar: "البحث في الأعضاء", fa: "جستجو در اعضا" },
  colMember: { en: "Member", ar: "العضو", fa: "عضو" },
  colEmail: { en: "Email", ar: "البريد الإلكتروني", fa: "ایمیل" },
  colWorkspaceRole: { en: "Workspace role", ar: "دور مساحة العمل", fa: "نقش در فضای کاری" },
  colProductAccess: { en: "Product access", ar: "الوصول للمنتجات", fa: "دسترسی به محصولات" },
  colStatus: { en: "Status", ar: "الحالة", fa: "وضعیت" },
  colActions: { en: "Actions", ar: "إجراءات", fa: "اقدامات" },
  view: { en: "View", ar: "عرض", fa: "مشاهده" },

  // Filters
  filterRole: { en: "Role", ar: "الدور", fa: "نقش" },
  filterProduct: { en: "Product", ar: "المنتج", fa: "محصول" },
  filterStatus: { en: "Status", ar: "الحالة", fa: "وضعیت" },
  filterJoined: { en: "Joined", ar: "تاريخ الانضمام", fa: "تاریخ عضویت" },
  optAll: { en: "All", ar: "الكل", fa: "همه" },
  optAllProducts: { en: "All products", ar: "كل المنتجات", fa: "همهٔ محصولات" },
  optAnyTime: { en: "Any time", ar: "أي وقت", fa: "هر زمان" },
  optLast7: { en: "Last 7 days", ar: "آخر ٧ أيام", fa: "۷ روز گذشته" },
  optLast30: { en: "Last 30 days", ar: "آخر ٣٠ يومًا", fa: "۳۰ روز گذشته" },
  optLast90: { en: "Last 90 days", ar: "آخر ٩٠ يومًا", fa: "۹۰ روز گذشته" },
  optOlder90: { en: "More than 90 days ago", ar: "قبل أكثر من ٩٠ يومًا", fa: "بیش از ۹۰ روز پیش" },
  productSmartFactory: { en: "Smart Factory", ar: "المصنع الذكي", fa: "کارخانه هوشمند" },
  productGpsTracking: { en: "Fleet Management", ar: "إدارة الأسطول", fa: "مدیریت ناوگان" },
  sortNameAsc: { en: "Name A–Z", ar: "الاسم أ–ي", fa: "نام، الف تا ی" },
  sortNewest: { en: "Newest first", ar: "الأحدث أولاً", fa: "جدیدترین" },
  actionExport: { en: "Export CSV", ar: "تصدير CSV", fa: "خروجی CSV" },

  // Statuses
  statusActive: { en: "Active", ar: "نشط", fa: "فعال" },
  statusInvited: { en: "Invited", ar: "مدعو", fa: "دعوت‌شده" },
  statusSuspended: { en: "Suspended", ar: "معلق", fa: "معلق" },
  statusPending: { en: "Pending", ar: "قيد الانتظار", fa: "در انتظار" },
  statusAccepted: { en: "Accepted", ar: "مقبولة", fa: "پذیرفته‌شده" },
  statusDeclined: { en: "Declined", ar: "مرفوضة", fa: "رد‌شده" },
  statusExpired: { en: "Expired", ar: "منتهية", fa: "منقضی" },

  // Roles & access
  sectionWorkspaceRoles: { en: "Workspace roles", ar: "أدوار مساحة العمل", fa: "نقش‌های فضای کاری" },
  sectionProductAccess: { en: "Product access", ar: "الوصول للمنتجات", fa: "دسترسی به محصولات" },
  roleOwner: { en: "Owner", ar: "المالك", fa: "مالک" },
  roleAdmin: { en: "Admin", ar: "مشرف", fa: "مدیر" },
  roleMember: { en: "Member", ar: "عضو", fa: "عضو" },
  roleViewer: { en: "Viewer", ar: "مشاهد", fa: "بیننده" },
  roleOwnerDesc: {
    en: "Full workspace access, including billing and closing the account",
    ar: "وصول كامل لمساحة العمل، بما في ذلك الفوترة وإغلاق الحساب",
    fa: "دسترسی کامل به فضای کاری، شامل صورتحساب و بستن حساب",
  },
  roleAdminDesc: {
    en: "Members, products and workspace settings",
    ar: "الأعضاء والمنتجات وإعدادات مساحة العمل",
    fa: "اعضا، محصولات و تنظیمات فضای کاری",
  },
  roleMemberDesc: {
    en: "Uses the products they have access to",
    ar: "يستخدم المنتجات التي لديه وصول إليها",
    fa: "از محصولاتی که به آن‌ها دسترسی دارد استفاده می‌کند",
  },
  roleViewerDesc: {
    en: "Read-only workspace access",
    ar: "وصول للقراءة فقط",
    fa: "دسترسی فقط‌خواندنی به فضای کاری",
  },
  roleSystemTag: { en: "Built in", ar: "مدمج", fa: "پیش‌فرض" },
  colAccess: { en: "Access", ar: "الوصول", fa: "دسترسی" },

  // Invitations
  invReceived: { en: "Received", ar: "الواردة", fa: "دریافتی" },
  invSent: { en: "Sent", ar: "المرسلة", fa: "ارسالی" },
  searchInvitations: { en: "Search in invitations", ar: "البحث في الدعوات", fa: "جستجو در دعوت‌نامه‌ها" },
  colWorkspace: { en: "Workspace", ar: "مساحة العمل", fa: "فضای کاری" },
  colInvitedBy: { en: "Invited by", ar: "دعاك", fa: "دعوت‌کننده" },
  colDate: { en: "Date", ar: "التاريخ", fa: "تاریخ" },
  colAction: { en: "Action", ar: "الإجراء", fa: "اقدام" },
  accept: { en: "Accept", ar: "قبول", fa: "پذیرفتن" },
  decline: { en: "Decline", ar: "رفض", fa: "رد کردن" },
  resend: { en: "Resend", ar: "إعادة الإرسال", fa: "ارسال دوباره" },
  cancelInvite: { en: "Cancel", ar: "إلغاء", fa: "لغو" },
  noteReceived: {
    en: "Received invitations are workspaces other people asked you to join. Accepting adds that workspace to your switcher; it does not move your current data.",
    ar: "الدعوات الواردة هي مساحات عمل طلب منك آخرون الانضمام إليها. القبول يضيف تلك المساحة إلى مبدّل الحسابات، ولا ينقل بياناتك الحالية.",
    fa: "دعوت‌نامه‌های دریافتی، فضاهای کاری‌ای هستند که دیگران از شما خواسته‌اند به آن‌ها بپیوندید. پذیرفتن، آن فضا را به سوییچر شما اضافه می‌کند و داده‌های فعلی شما را جابه‌جا نمی‌کند.",
  },
  noteSent: {
    en: "The person appears in Members only after they accept, with exactly the product access chosen when they were invited.",
    ar: "يظهر الشخص في الأعضاء بعد القبول فقط، وبنفس الوصول للمنتجات الذي اختير عند دعوته.",
    fa: "فرد فقط پس از پذیرفتن در فهرست اعضا دیده می‌شود، با همان دسترسی به محصولاتی که هنگام دعوت انتخاب شده است.",
  },

  // Confirms
  confirmAcceptTitle: { en: "Accept this invitation?", ar: "قبول هذه الدعوة؟", fa: "این دعوت‌نامه پذیرفته شود؟" },
  confirmAcceptDesc: {
    en: "You will join this workspace and it will appear in your workspace switcher.",
    ar: "ستنضم إلى مساحة العمل هذه وستظهر في مبدّل مساحات العمل لديك.",
    fa: "به این فضای کاری می‌پیوندید و در سوییچر فضاهای کاری شما دیده می‌شود.",
  },
  confirmDeclineTitle: { en: "Decline this invitation?", ar: "رفض هذه الدعوة؟", fa: "این دعوت‌نامه رد شود؟" },
  confirmDeclineDesc: {
    en: "The invitation is closed. Whoever invited you would have to send a new one.",
    ar: "ستُغلق الدعوة. وسيتعين على من دعاك إرسال دعوة جديدة.",
    fa: "دعوت‌نامه بسته می‌شود و هر کس دعوتتان کرده باید دعوت تازه‌ای بفرستد.",
  },
  cancel: { en: "Cancel", ar: "إلغاء", fa: "انصراف" },

  // Invite panel
  currentWorkspace: { en: "Workspace: {name}", ar: "مساحة العمل: {name}", fa: "فضای کاری: {name}" },
  invitePanelDesc: {
    en: "They receive an email invitation to this workspace.",
    ar: "سيصلهم بريد دعوة إلى مساحة العمل هذه.",
    fa: "برای او یک ایمیل دعوت به این فضای کاری فرستاده می‌شود.",
  },
  emailLabel: { en: "Email", ar: "البريد الإلكتروني", fa: "ایمیل" },
  emailPlaceholder: { en: "user@example.com", ar: "user@example.com", fa: "user@example.com" },
  sendInvitation: { en: "Send Invitation", ar: "إرسال الدعوة", fa: "ارسال دعوت‌نامه" },
  productAccessLabel: { en: "Product access", ar: "الوصول للمنتجات", fa: "دسترسی به محصولات" },
  noAccess: { en: "No access", ar: "بدون وصول", fa: "بدون دسترسی" },
  inviteSent: { en: "Invitation sent to {email}", ar: "أُرسلت الدعوة إلى {email}", fa: "دعوت‌نامه برای {email} فرستاده شد" },
  inviteFailed: { en: "Could not send the invitation", ar: "تعذر إرسال الدعوة", fa: "ارسال دعوت‌نامه ناموفق بود" },

  // New role panel
  newRoleDesc: {
    en: "A role is a set of permissions you can give to several people at once.",
    ar: "الدور مجموعة صلاحيات يمكن منحها لعدة أشخاص دفعة واحدة.",
    fa: "نقش، مجموعه‌ای از دسترسی‌هاست که می‌توانید یک‌جا به چند نفر بدهید.",
  },
  roleNameLabel: { en: "Role name", ar: "اسم الدور", fa: "نام نقش" },
  roleNamePlaceholder: { en: "e.g. Line Supervisor", ar: "مثلاً مشرف الخط", fa: "مثلاً سرپرست خط" },
  roleDescLabel: { en: "Description", ar: "الوصف", fa: "توضیحات" },
  roleDescPlaceholder: {
    en: "What this role is for",
    ar: "ما الغرض من هذا الدور",
    fa: "این نقش برای چیست",
  },
  basedOnLabel: { en: "Based on", ar: "مبني على", fa: "بر پایهٔ" },
  permissionsLabel: { en: "Permissions per product", ar: "الصلاحيات لكل منتج", fa: "دسترسی هر محصول" },
  permNone: { en: "No access", ar: "بدون وصول", fa: "بدون دسترسی" },
  permRead: { en: "Read only", ar: "قراءة فقط", fa: "فقط خواندن" },
  permWrite: { en: "Read & write", ar: "قراءة وكتابة", fa: "خواندن و نوشتن" },
  createRole: { en: "Create role", ar: "إنشاء الدور", fa: "ساخت نقش" },

  // Empty states and the honest note
  noMembersYet: { en: "No members yet", ar: "لا يوجد أعضاء بعد", fa: "هنوز عضوی نیست" },
  noMembersDesc: {
    en: "Invite someone and they appear here once they accept.",
    ar: "ادعُ شخصًا وسيظهر هنا بعد أن يقبل.",
    fa: "کسی را دعوت کنید؛ پس از پذیرفتن اینجا دیده می‌شود.",
  },
  noInvitations: { en: "No invitations", ar: "لا توجد دعوات", fa: "دعوت‌نامه‌ای نیست" },
  noProductAccess: { en: "No product access yet", ar: "لا يوجد وصول للمنتجات بعد", fa: "هنوز دسترسی محصولی ثبت نشده" },
  noResults: { en: "No results", ar: "لا توجد نتائج", fa: "نتیجه‌ای یافت نشد" },
  noMembersMatch: {
    en: "No member matches these filters. Try another filter or clear them.",
    ar: "لا يوجد عضو يطابق عوامل التصفية هذه. جرّب عاملاً آخر أو امسحها.",
    fa: "هیچ عضوی با این فیلترها مطابقت ندارد. فیلتر دیگری را امتحان کنید یا آن‌ها را پاک کنید.",
  },
  clearFilters: { en: "Clear filters", ar: "مسح عوامل التصفية", fa: "پاک کردن فیلترها" },
  backendNote: {
    en: "Members, received invitations and inviting a member are live. Product access per member, roles and sent invitations have no endpoint yet, so they report no data.",
    ar: "الأعضاء والدعوات الواردة ودعوة عضو تعمل فعليًا. الوصول للمنتجات لكل عضو والأدوار والدعوات المرسلة لا تملك خدمة بعد، لذلك تعرض لا توجد بيانات.",
    fa: "فهرست اعضا، دعوت‌نامه‌های دریافتی و دعوت عضو واقعاً کار می‌کنند. دسترسی محصول هر عضو، نقش‌ها و دعوت‌نامه‌های ارسالی هنوز اندپوینتی ندارند و «فاقد دیتا» نشان می‌دهند.",
  },
  loadMembersFailed: { en: "Could not load members.", ar: "تعذر تحميل الأعضاء.", fa: "فهرست اعضا بارگذاری نشد." },
  loadInvitationsFailed: { en: "Could not load invitations.", ar: "تعذر تحميل الدعوات.", fa: "دعوت‌نامه‌ها بارگذاری نشد." },
  retry: { en: "Try again", ar: "حاول مرة أخرى", fa: "تلاش دوباره" },
  noInvitePermission: {
    en: "You don't have permission to invite members.",
    ar: "ليست لديك صلاحية دعوة الأعضاء.",
    fa: "شما مجوز دعوت عضو را ندارید.",
  },
  comingSoon: { en: "Coming soon", ar: "قريبًا", fa: "به‌زودی" },
};
