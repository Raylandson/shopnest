import { RegisterDto } from './register.dto';

// LoginDto inherits all properties and their Swagger documentation from RegisterDto.
// If LoginDto should only have a subset of properties, or different descriptions,
// you might need to define it separately or use Mapped Types like PickType, OmitType, PartialType.
// For now, assuming it uses all properties from RegisterDto.
export class LoginDto extends RegisterDto {}
