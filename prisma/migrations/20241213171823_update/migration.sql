/*
  Warnings:

  - You are about to drop the column `access_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `session_state` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Account` table. All the data in the column will be lost.
  - Added the required column `byUser` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProviderSocial" AS ENUM ('GOOGLE', 'FACEBOOK', 'GITHUB');

-- DropIndex
DROP INDEX "PasswordResetToken_token_key";

-- DropIndex
DROP INDEX "TwoFactorToken_token_key";

-- DropIndex
DROP INDEX "VerificationToken_token_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "access_token",
DROP COLUMN "expires_at",
DROP COLUMN "id_token",
DROP COLUMN "refresh_token",
DROP COLUMN "scope",
DROP COLUMN "session_state",
DROP COLUMN "token_type",
DROP COLUMN "type",
ADD COLUMN     "byUser" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "id_token" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "session_state" TEXT,
ADD COLUMN     "token_type" TEXT;
