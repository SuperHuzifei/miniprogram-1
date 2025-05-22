/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo: any | null,
    isLogin: boolean
  }
  userInfoReadyCallback?: ((userInfo: any) => void) | null,
  checkLoginStatus: () => void,
  userLogin: (userInfo: any, callback?: Function) => void
}