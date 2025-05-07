
interface Club {
  readonly id: number;
  readonly name: string;
  readonly asblnumber?: string;
  readonly assocuserid1?: number;
  readonly assocuserid2?: number;
  readonly assocuserid3?: number;
  readonly bankaccount?: string;
  readonly city: string;
  readonly coloraway1?: string;
  readonly coloraway2?: string;
  readonly colorhome1?: string;
  readonly colorhome2?: string;
  readonly email: string;
  readonly halls: readonly SportHall[];
  readonly isactive: number;
  readonly logo?: string;
  readonly matriculation: number;
  readonly phone: string;
  readonly postcode: string;
  readonly region: string;
  readonly shortname?: string;
  readonly streetaddress?: string;
  readonly type?: string;
  readonly website?: string;
  getNameFormatted: () => string;
}
  
interface SportHall {
  readonly id: number;
  readonly city: string;
  readonly clubname?: string;
  readonly name: string;
  readonly postcode: number;
  readonly streetaddress: string;
}


interface GameParticipation {
  playerId: number,
  teamId: number
}
