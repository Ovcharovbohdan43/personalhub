export type Dictionary = {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    noData: string;
    read: string;
    new: string;
    income: string;
    expense: string;
    balance: string;
    earned: string;
    spent: string;
    creditPayments: string;
    topExpenses: string;
    creditPaymentsList: string;
    days: string;
    thisMonth: string;
    incomeHint: string;
  };
  nav: Record<
    | 'dashboard'
    | 'finances'
    | 'notes'
    | 'tasks'
    | 'bookmarks'
    | 'documents'
    | 'aiAssessment'
    | 'profile'
    | 'settings'
    | 'logout',
    string
  >;
  auth: Record<
    | 'login'
    | 'register'
    | 'forgotPassword'
    | 'welcomeBack'
    | 'createAccount'
    | 'noAccount'
    | 'hasAccount'
    | 'signIn'
    | 'signingIn'
    | 'signUp'
    | 'creating'
    | 'sendLink'
    | 'sending'
    | 'backToLogin'
    | 'resetPassword'
    | 'resetHint'
    | 'newPassword'
    | 'confirmPassword'
    | 'newPasswordHint'
    | 'savePassword'
    | 'savingPassword'
    | 'email'
    | 'password'
    | 'displayName',
    string
  >;
  dashboard: Record<string, string>;
  settings: Record<string, string>;
  notifications: Record<string, string>;
  finances: Record<string, string>;
  notes: Record<string, string>;
  tasks: Record<string, string>;
  bookmarks: Record<string, string>;
  documents: Record<string, string>;
  profile: Record<string, string>;
  aiAssessment: Record<string, string>;
  search: Record<string, string>;
  priority: { high: string; medium: string; low: string };
  validation: Record<string, string>;
};
