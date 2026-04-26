ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "organizations_tenant_isolation"
ON "organizations"
FOR ALL
USING ("id" = nullif(current_setting('app.organization_id', true), '')::uuid)
WITH CHECK ("id" = nullif(current_setting('app.organization_id', true), '')::uuid);
--> statement-breakpoint
DO $$
DECLARE
  tenant_table text;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'stores',
    'departments',
    'roles',
    'memberships',
    'photo_missions',
    'media_upload_intents',
    'media_objects',
    'feed_posts',
    'comments',
    'reactions',
    'polls',
    'announcements',
    'moderation_actions',
    'shifts',
    'availability_windows',
    'time_off_requests',
    'shift_swap_requests',
    'coverage_rules',
    'schedule_notifications',
    'quality_standards',
    'checklists',
    'checklist_runs',
    'issues',
    'shift_summaries',
    'points_ledger',
    'badges',
    'achievements',
    'recognition_events',
    'dashboard_metric_snapshots',
    'analytics_events',
    'attention_area_snapshots',
    'audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid) WITH CHECK (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid)',
      tenant_table || '_tenant_isolation',
      tenant_table
    );
  END LOOP;
END $$;
