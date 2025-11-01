import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../entities/User.js';
import { Wallet } from '../entities/Wallet.js';
import { generateReferralCode } from '../utils/otp.js';
import { AppDataSource } from './database.js';
import { config } from './env.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const walletRepository = AppDataSource.getRepository(Wallet);

        let user = await userRepository.findOne({
          where: { googleId: profile.id },
        });

        if (user) {

          return done(null, user);
        }

        user = await userRepository.findOne({
          where: { email: profile.emails?.[0]?.value },
        });

        if (user) {

          user.googleId = profile.id;
          if (profile.photos?.[0]?.value) {
            user.avatarUrl = profile.photos[0].value;
          }
          await userRepository.save(user);
          return done(null, user);
        }

        const newUser = new User();
        newUser.googleId = profile.id;
        newUser.email = profile.emails?.[0]?.value || '';
        newUser.name = profile.displayName || '';
        newUser.avatarUrl = profile.photos?.[0]?.value;
        newUser.referralCode = generateReferralCode();
        newUser.isActive = true;
        newUser.emailVerified = true;
        newUser.createdFromApp = true;

        const savedUser = await userRepository.save(newUser);

        const wallet = new Wallet();
        wallet.userId = savedUser.id;
        wallet.balance = 0;
        await walletRepository.save(wallet);

        return done(null, savedUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
