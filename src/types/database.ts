/**
 * Database schema types.
 *
 * Hand-written to match supabase/migrations/0001_init.sql.
 * Regenerate automatically after schema changes with:
 *   pnpm dlx supabase gen types typescript --project-id ddykmiblwpjdeerykmnk > src/types/database.ts
 */

export type TransactionTypeDB = "expense" | "income";
export type PaymentMethodDB = "card" | "cash" | "pix" | "transfer";
export type RecurrenceTypeDB = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type NecessityTagDB = "necessary" | "unnecessary" | "pending";
export type CategoryScopeDB = "expense" | "income" | "both";
export type GoalPriorityDB = "low" | "medium" | "high";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          currency: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          currency?: string;
          theme?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          currency?: string;
          theme?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          type: CategoryScopeDB;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          color: string;
          icon: string;
          type: CategoryScopeDB;
          is_default?: boolean;
        };
        Update: {
          name?: string;
          color?: string;
          icon?: string;
          type?: CategoryScopeDB;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: TransactionTypeDB;
          amount: number;
          description: string;
          category_id: string | null;
          payment_method: PaymentMethodDB;
          date: string;
          recurrence: RecurrenceTypeDB;
          recurrence_end_date: string | null;
          tags: string[] | null;
          necessity_tag: NecessityTagDB;
          notes: string | null;
          is_scheduled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          type: TransactionTypeDB;
          amount: number;
          description: string;
          category_id?: string | null;
          payment_method: PaymentMethodDB;
          date: string;
          recurrence?: RecurrenceTypeDB;
          recurrence_end_date?: string | null;
          tags?: string[] | null;
          necessity_tag?: NecessityTagDB;
          notes?: string | null;
          is_scheduled?: boolean;
        };
        Update: {
          type?: TransactionTypeDB;
          amount?: number;
          description?: string;
          category_id?: string | null;
          payment_method?: PaymentMethodDB;
          date?: string;
          recurrence?: RecurrenceTypeDB;
          recurrence_end_date?: string | null;
          tags?: string[] | null;
          necessity_tag?: NecessityTagDB;
          notes?: string | null;
          is_scheduled?: boolean;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          type: TransactionTypeDB;
          category_id: string | null;
          payment_method: PaymentMethodDB;
          recurrence: RecurrenceTypeDB;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          last_generated: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          amount: number;
          type: TransactionTypeDB;
          category_id?: string | null;
          payment_method: PaymentMethodDB;
          recurrence: RecurrenceTypeDB;
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
          last_generated?: string | null;
        };
        Update: {
          name?: string;
          amount?: number;
          type?: TransactionTypeDB;
          category_id?: string | null;
          payment_method?: PaymentMethodDB;
          recurrence?: RecurrenceTypeDB;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          last_generated?: string | null;
        };
      };
      monthly_reports: {
        Row: {
          id: string;
          user_id: string;
          month: number;
          year: number;
          total_income: number;
          total_expense: number;
          balance: number;
          necessary_expenses: number;
          unnecessary_expenses: number;
          is_finalized: boolean;
          insights: string[] | null;
          finalized_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          month: number;
          year: number;
          total_income?: number;
          total_expense?: number;
          balance?: number;
          necessary_expenses?: number;
          unnecessary_expenses?: number;
          is_finalized?: boolean;
          insights?: string[] | null;
          finalized_at?: string | null;
        };
        Update: {
          total_income?: number;
          total_expense?: number;
          balance?: number;
          necessary_expenses?: number;
          unnecessary_expenses?: number;
          is_finalized?: boolean;
          insights?: string[] | null;
          finalized_at?: string | null;
        };
      };
      investment_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          category: string;
          priority: GoalPriorityDB;
          target_amount: number;
          deadline: string | null;
          color: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          category?: string;
          priority?: GoalPriorityDB;
          target_amount: number;
          deadline?: string | null;
          color?: string;
          is_archived?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          category?: string;
          priority?: GoalPriorityDB;
          target_amount?: number;
          deadline?: string | null;
          color?: string;
          is_archived?: boolean;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string | null;
          name: string;
          institution: string;
          type: string;
          amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          goal_id?: string | null;
          name: string;
          institution: string;
          type: string;
          amount?: number;
          notes?: string | null;
        };
        Update: {
          goal_id?: string | null;
          name?: string;
          institution?: string;
          type?: string;
          amount?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      investment_contributions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string | null;
          investment_id: string | null;
          amount: number;
          contribution_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          goal_id?: string | null;
          investment_id?: string | null;
          amount: number;
          contribution_date?: string;
          notes?: string | null;
        };
        Update: {
          goal_id?: string | null;
          investment_id?: string | null;
          amount?: number;
          contribution_date?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_type: TransactionTypeDB;
      payment_method: PaymentMethodDB;
      recurrence_type: RecurrenceTypeDB;
      necessity_tag: NecessityTagDB;
      category_scope: CategoryScopeDB;
    };
  };
}
