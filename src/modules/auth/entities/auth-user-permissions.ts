import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class AuthUserPermissions {

    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    status: boolean;

    @Column()
    createdAt: Date;

    @Column()
    userId: string

}

