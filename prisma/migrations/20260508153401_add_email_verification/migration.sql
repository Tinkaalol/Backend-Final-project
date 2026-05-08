-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifyExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerifyToken" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateIndex
CREATE INDEX "User_emailVerifyToken_idx" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");
