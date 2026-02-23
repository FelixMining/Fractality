export interface SyncTableConfig {
  dexieStore: string
  supabaseTable: string
}

class SyncRegistry {
  private tables: SyncTableConfig[] = []

  register(config: SyncTableConfig): void {
    if (!this.isRegistered(config.dexieStore)) {
      this.tables.push(config)
    }
  }

  getAll(): SyncTableConfig[] {
    return [...this.tables]
  }

  isRegistered(dexieStore: string): boolean {
    return this.tables.some((t) => t.dexieStore === dexieStore)
  }

  getSupabaseTable(dexieStore: string): string | undefined {
    return this.tables.find((t) => t.dexieStore === dexieStore)?.supabaseTable
  }
}

export const syncRegistry = new SyncRegistry()
