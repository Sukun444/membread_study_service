import { BaseEntity, Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class CourseProgress extends BaseEntity {
    @PrimaryColumn({name : 'participant_id'})
    participantId : string;

    @PrimaryColumn({name : 'learning_id'})
    learningId : number;

    @Column({name : 'need_to_review',default:'false'})
    needToReview : boolean

    @Column({default : 0})
    progress : number;

    @UpdateDateColumn({
        default : 'now()',
        nullable : true,
        name : 'last_updated'
    })
    lastUpdated : Date
}