CREATE TABLE "availability" (
    "id" serial PRIMARY KEY,
    "user_id" integer,
    "day_of_week" varchar(20) NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL
);

CREATE TABLE "blocked_users" (
    "blocker_id" integer,
    "blocked_id" integer,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_users_pkey" PRIMARY KEY("blocker_id","blocked_id"),
    CONSTRAINT "blocked_users_check" CHECK ((blocker_id <> blocked_id))
);

CREATE TABLE "classes" (
    "id" serial PRIMARY KEY,
    "code" varchar(50) NOT NULL CONSTRAINT "classes_code_key" UNIQUE
);

CREATE TABLE "conversation_members" (
    "conversation_id" integer,
    "user_id" integer,
    "joined_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" timestamp DEFAULT NULL,
    CONSTRAINT "conversation_members_pkey" PRIMARY KEY("conversation_id","user_id")
);

CREATE TABLE "conversations" (
    "id" serial PRIMARY KEY,
    "is_group" boolean DEFAULT false,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "lost_items" (
    "id" serial PRIMARY KEY,
    "user_id" integer,
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "lost_items_content_check" CHECK ((char_length(content) <= 5000))
);

CREATE TABLE "messages" (
    "id" serial PRIMARY KEY,
    "conversation_id" integer,
    "sender_id" integer,
    "body" text NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "study_tickets" (
    "id" serial PRIMARY KEY,
    "creator_id" integer,
    "class_code" varchar(20) NOT NULL,
    "location" varchar(255) NOT NULL,
    "study_date" varchar(50) NOT NULL,
    "study_time" varchar(50) NOT NULL,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "user_classes" (
    "user_id" integer,
    "class_id" integer,
    "professor" varchar(100),
    CONSTRAINT "user_classes_pkey" PRIMARY KEY("user_id","class_id")
);

CREATE TABLE "users" (
    "id" serial PRIMARY KEY,
    "uid" varchar(20) NOT NULL CONSTRAINT "users_uid_key" UNIQUE,
    "name" varchar(100) NOT NULL,
    "password_hash" text NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
