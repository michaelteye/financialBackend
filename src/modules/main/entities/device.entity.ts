import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from './abstract-entity';

import { UserEntity } from './user.entity';

@Entity()
export class DeviceEntity extends AbstractEntity {
  @Column('text', { nullable: true })
  name?: string;

  @Column('text', { nullable: true })
  deviceType?: string;

  @Column('text', { nullable: true })
  deviceId?: string;

  @ManyToOne(() => UserEntity, (user) => user.devices)
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column('uuid', { nullable: true })
  userId?: string;
}

// createAt = '2022-12-20 14:09:16.929691'
// updatedAt = '2022-12-20 14:09:16.929691'
// name = 'sip'       hhdviin 
// deviceType = 'phone'
// userId = '21a004d2-9858-438f-ad68-d10975d07ac7'

// INSERT INTO "device_entity"(
	// "createdAt", "updatedAt", name, "deviceType", "deviceId", "userId")
	// VALUES ('2023-02-05 14:09:16.929691', '2023-03-07 14:09:16.929691', 'my phone', 'phone', '21a004d2-9858-438f-ad68-d10975d07ac7', '21a004d2-9858-438f-ad68-d10975d07ac7');

