import * as bcrypt from 'bcrypt';

export class Hash {
    private static readonly SALT_ROUNDS = 10;
    static async make(plainText: string): Promise<string> {
        const salt = bcrypt.genSaltSync(this.SALT_ROUNDS);
        return bcrypt.hashSync(plainText, salt);
    }

    static async compare(plainText: string, hash: string): Promise<boolean> {
        return bcrypt.compareSync(plainText, hash);
    }
}