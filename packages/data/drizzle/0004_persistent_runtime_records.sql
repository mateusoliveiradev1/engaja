CREATE TABLE "persistent_runtime_records" (
  "collection" varchar(80) NOT NULL,
  "record_id" varchar(240) NOT NULL,
  "organization_id" varchar(160) NOT NULL,
  "store_id" varchar(160),
  "department_id" varchar(160),
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "persistent_runtime_records_collection_record_id_pk" PRIMARY KEY("collection","record_id")
);
--> statement-breakpoint
CREATE INDEX "persistent_runtime_records_scope_idx" ON "persistent_runtime_records" USING btree ("collection","organization_id","store_id","department_id");
