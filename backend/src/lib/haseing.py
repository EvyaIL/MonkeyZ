from passlib.context import CryptContext

pwa_cxt = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Hase:
    @staticmethod
    def bcrypt(password: str) -> str:
        return pwa_cxt.hash(password)
    
    @staticmethod
    def verify(password: str, hashed_password: str) -> bool:
        return pwa_cxt.verify(password, hashed_password)  

