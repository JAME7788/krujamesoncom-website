// ระบบคลังสไลด์ภาพประกอบการสอน (ChatGPT DALL-E 3 & High-Res 16:9 จาก Google Drive & Cloud CDN)
// ความละเอียดสูง โหลดผ่าน Google Cloud CDN และ Web Assets ไม่เปลืองพื้นที่จัดเก็บ (Zero Disk Bloat)

export interface DriveSlideItem {
  url: string;
  driveId?: string;
  title?: string;
}

export const unitSlideImages: Record<string, Record<number, string[]>> = {
  "m1-design": {
    "1": [
      "https://lh3.googleusercontent.com/d/1szSY_PiDrQUnyjXY6psfYYp2cPniozhs",
      "https://lh3.googleusercontent.com/d/18KJICfI5oE9sluubu_7ohgb0Xyum96Hw",
      "https://lh3.googleusercontent.com/d/10xLuEzNsfNOT0pT-993wsetjZIdbtqjX",
      "https://lh3.googleusercontent.com/d/1s97bvw2WefIjlDy2lSezVwHRUeQ0Ycso",
      "https://lh3.googleusercontent.com/d/1U43vEToCNZ0jYAScdI1rJZJoKE-B6Lg2",
      "https://lh3.googleusercontent.com/d/10NcjX4iD3u4_eyGIar3MGMsVxJ3Gw8V_"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1l96OPX8TJ4qLtUiaP25RUx1AxQHPqMFm",
      "https://lh3.googleusercontent.com/d/1j3fPiunXI8fBu9KJiYMSGeWZiKp-ICsd",
      "https://lh3.googleusercontent.com/d/1dF2p3TG9U3xz5wIfojKCuq___bzlHhfh",
      "https://lh3.googleusercontent.com/d/1KPdUnY5_2acnKuitXvSTGm_A0-Kxxv_I",
      "https://lh3.googleusercontent.com/d/1-nie_ywtqOfkx80Ji3MlkQh8f3ZeCGpA",
      "https://lh3.googleusercontent.com/d/1IgFB0gtCIt5nob7suiwTZww8t4SAurCZ"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1IhmaKpCp0Tmzm0iZ_PNaF3Am0i6JLfiC",
      "https://lh3.googleusercontent.com/d/154MUo4mRV9n2eupZnUk1KLe4Rpsi1BA9",
      "https://lh3.googleusercontent.com/d/1UkVaa_6eakw_uxb5mYyOkbAY3jkMBY_7",
      "https://lh3.googleusercontent.com/d/1nAgw2ewbyLJ_vKMnltiO9IDIKcdAjWuk",
      "https://lh3.googleusercontent.com/d/1Kj5y2OzeJIC8LmR8Oh3JO2Q0piii2u3s",
      "https://lh3.googleusercontent.com/d/1imwjktDegsQCfwuJfYEJs15VIEo29l48"
    ]
  },
  "m2-design": {
    "1": [
      "https://lh3.googleusercontent.com/d/1TQVK0Qj_ogpXiIOXyoSwgEfjcNeX2rWG",
      "https://lh3.googleusercontent.com/d/11Vz7RlRa3GE1FpG23z_S80wqFsOdWnvt",
      "https://lh3.googleusercontent.com/d/1s2lSn4ebMhVq3C8siVvajWH_zjGem9L9",
      "https://lh3.googleusercontent.com/d/1CnthcqeOR0tcp0BakVWaSSfwFzPpmvqM",
      "https://lh3.googleusercontent.com/d/1bkGbOrB7DnBfD74z9m8J3VhFbCDMao1D",
      "https://lh3.googleusercontent.com/d/172r9TiDwGnjgY0KB4VbCpd4Kgp5mePiZ"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1fevUeXtuirs7PDiPrjtTs7TxmqlQSOYn",
      "https://lh3.googleusercontent.com/d/1sd-3duVVtq53DPBwRZr2ycea-OOibo8Y",
      "https://lh3.googleusercontent.com/d/1FtfAcsbTC2DZ4czN4Bm3ERvYsUXqLjoq",
      "https://lh3.googleusercontent.com/d/1TDW3N8t3F8d4xHpdTzy110Uq1c2srwda",
      "https://lh3.googleusercontent.com/d/1yw8mAQUp-XsNpoanXeg5KamHcB1z54m6",
      "https://lh3.googleusercontent.com/d/1OlyBCSKWXImSTCu94YBtcSuETYhC6u4b"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/16Qv8n2kf_pDQTx8FUqfAtuTVoWrjix6J",
      "https://lh3.googleusercontent.com/d/19xeFHUKX8tRE5Pluv-G5DFdEe7o47wFh",
      "https://lh3.googleusercontent.com/d/1g2aYRtN4Zz3UqnJQ-hy_zTIBRwU0seyF",
      "https://lh3.googleusercontent.com/d/1OA_6u_Q9s2rjzC8oJJO-mjEp72_8fd2u",
      "https://lh3.googleusercontent.com/d/1v7tzzNTydJf_gZaRWLe1p1ua3xxVK12A",
      "https://lh3.googleusercontent.com/d/1nFSZg1i9FBz0AvIVyr2BLe6C1kHYHZ2P"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1PAvfMKn1i7a6BGDspndMtHzNI5ro3XRi",
      "https://lh3.googleusercontent.com/d/1N6NLLx4tGX7XY9RLK4jQ4W5U7w3d_CFW",
      "https://lh3.googleusercontent.com/d/1z5je2gkQxZy6vB5cQ7j6Az_RMa6yY6S0",
      "https://lh3.googleusercontent.com/d/1CTwbVUeb4eRRIzGrYS6XIOMMDnPbLAR2",
      "https://lh3.googleusercontent.com/d/11KPtQPyNAlnlSQvfxe_9eDeKiQvPjiay",
      "https://lh3.googleusercontent.com/d/1Mzuk5uCN97RnyYVe3FuXpnpvGGeFEOtD"
    ]
  },
  "m3-design": {
    "1": [
      "https://lh3.googleusercontent.com/d/1GAAQrdnzi1gHaC8uFj6K48aFh8pevh1n",
      "https://lh3.googleusercontent.com/d/13cZEuPnad5Ct9L1q0nZNaZN8-h9lZ-dk",
      "https://lh3.googleusercontent.com/d/1tTu78N3DwyWiHJPM0vEa5IigwVGaz9Zd",
      "https://lh3.googleusercontent.com/d/1sImyrKSBAWwVzX2lPg2WHE15zp2X0IDv",
      "https://lh3.googleusercontent.com/d/1N5hOcPTUP14YgHM6uVH48b58REPNqQy0",
      "https://lh3.googleusercontent.com/d/1E5tBTHUUIz58eWYuWlxBrO0C541_IePM"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1YKhzM7TYQwsT5ogJgpYvLqwOGTs5XH7k",
      "https://lh3.googleusercontent.com/d/1BbIj-XipnP-yrTNrm0IwO-62otmjc5r4",
      "https://lh3.googleusercontent.com/d/1UKq8vJJiSvnzO3y6qCC77uOyoNB20Sgz",
      "https://lh3.googleusercontent.com/d/1_KbR2HuGZxTKfgqdWLZbCtp1FR8rqSc4",
      "https://lh3.googleusercontent.com/d/1L5-Nbv50gclcWRatk_U1kT8ccsZoAZMM",
      "https://lh3.googleusercontent.com/d/16yFMSYioZFbPvHagp6SJ6_aYjw70JzB7"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1wxXxDtB6Gkm0H6fC_39HC0y6HruXjEtV",
      "https://lh3.googleusercontent.com/d/1DlLdUn7pYlSBJwj9AkBugb_fcdwoa33n",
      "https://lh3.googleusercontent.com/d/1csY2g0hBu6bIGC2axfcDMOpl1JAql4id",
      "https://lh3.googleusercontent.com/d/14zX11tDZIaEtqtEJOz-tKLX_46FP4Pth",
      "https://lh3.googleusercontent.com/d/1DxElnYLlKScNmHjpTfJQUeydVkLzrMGg",
      "https://lh3.googleusercontent.com/d/1v3poJY9k1KUVgButGF_yFkPjDlMi3k6V"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1Pmxwqr26zP-txCPjDeBYzyr2MsyBZ3I9",
      "https://lh3.googleusercontent.com/d/1SEdsdcXWcZnCxXHCd2uJ3u56d2k8rDhh",
      "https://lh3.googleusercontent.com/d/1jemb8uXBkrE0ZrBFvXj9N0xf60eHcwef",
      "https://lh3.googleusercontent.com/d/117_GTnOiJbkUsXcVOdU0xxcRK0T5Z_YX",
      "https://lh3.googleusercontent.com/d/17x16XCLmHlfh4dbu08aUbGO1vEFQC9eK",
      "https://lh3.googleusercontent.com/d/1a5rHsRY5PAt-uUg7o7GeiUheAVJVzQ0_"
    ]
  },
  "m1-cs": {
    "1": [
      "https://lh3.googleusercontent.com/d/1takiMEGz_imgrdQmWA6NtZ2PTZpzcgyu",
      "https://lh3.googleusercontent.com/d/14h4w3Ruqg_mVVsYTvZBOKldHlMOmfrXw",
      "https://lh3.googleusercontent.com/d/1-k9gB32Cny1ZXGF0I7F18tGdopz6DJ2Z",
      "https://lh3.googleusercontent.com/d/1t1-6lSKjdm72BDmvCJOvlNxzoUySkg9X",
      "https://lh3.googleusercontent.com/d/1b-bKUCBMWd9L9wBCVPLegV3AAszQZaPQ",
      "https://lh3.googleusercontent.com/d/1F8caoCDHzh_s2RuRGnEZQxASqURVHHyD"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1mGmb6AlabpmMA-WnE4h6EsVLht0vNCjb",
      "https://lh3.googleusercontent.com/d/1Sc6QM_3jRcof-ZiVf6C98iB4yt0ko8gf",
      "https://lh3.googleusercontent.com/d/192VkRfsFluf_-LAjaU-UG0wU33W_WkFp",
      "https://lh3.googleusercontent.com/d/1VyU6D7r-9smH7UgujaxXtD8yq5dCD48D",
      "https://lh3.googleusercontent.com/d/1jUz5LKK9rHBgT497GB1mA6ZU8w8HfdrE",
      "https://lh3.googleusercontent.com/d/1CMlqRAYRlyYgi8TT5Rxs8yjmGVE-yrY8"
    ]
  },
  "m2-cs": {
    "1": [
      "https://lh3.googleusercontent.com/d/16z1A1VNsvD1f_HOcMAyvzkYrWFZxG6tp",
      "https://lh3.googleusercontent.com/d/1JJoHEVR7kLgjEm6U-bfDzstwaiaxqvDR",
      "https://lh3.googleusercontent.com/d/1PlbeWtsYWbNZKMxLcyTS2wGK0DJnzi_B",
      "https://lh3.googleusercontent.com/d/1FPCYsr4fnmvrV06-qjDTqA4vml-JkzJv",
      "https://lh3.googleusercontent.com/d/12TSWbr6zRZZQh9ktARB2f9awKH-LQixH",
      "https://lh3.googleusercontent.com/d/1SOm_XrZmtDGQ1LpoYKPNwLmsArho-Ufw"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1R4_RD--Mtjx9Hr0jkP4_0-p-vrcsYrHl",
      "https://lh3.googleusercontent.com/d/1afIt0fS8T0AZjox14PgRxlERgl_RmSG8",
      "https://lh3.googleusercontent.com/d/1MYVxkvCIbt5tHHm7q9Wr2yOZornHLRp7",
      "https://lh3.googleusercontent.com/d/1vrBoolLYoaJuht58x0J8YemmSRZprSft",
      "https://lh3.googleusercontent.com/d/1IyicmvuoGcTYjGZ9qQGlqAPFDcgfxyS3",
      "https://lh3.googleusercontent.com/d/12W03cIZexMjIB7W-GPyvoZ_B8Tzdg50X"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1xJ60KhJ0-zmRPltR83TUSMEx0PcCNPxa",
      "https://lh3.googleusercontent.com/d/1eMjUbVrAWOb6VM26TGex_NURU3duEyAj",
      "https://lh3.googleusercontent.com/d/1RP9VlqyDqyk7F4uc6Y4wiWx-f_49ZPNN",
      "https://lh3.googleusercontent.com/d/13M2W1KMF-8DiWvwMygLnzAUoX3yXJNLS",
      "https://lh3.googleusercontent.com/d/1QgWp_uTICU60B7wXw5kMIVKj4kNSqnK0",
      "https://lh3.googleusercontent.com/d/1d79Z_yS6_143V3H0l2PyWKMWPA3rYN72"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1Ag6RABujgS8LXrKYZFU4_whVPKpbrESP",
      "https://lh3.googleusercontent.com/d/1jBDF13T6HODogAg8ZHClpEC3ADnX-eEy",
      "https://lh3.googleusercontent.com/d/19khbTquZwoB1jNtGKgR5crKYtajHai90",
      "https://lh3.googleusercontent.com/d/1tMhfy8n6XJJrgHPcEdf30uOqj_dwqv67",
      "https://lh3.googleusercontent.com/d/1v_XNyqZ3gvd9AzEwNSrQBX64mJtLXgFA",
      "https://lh3.googleusercontent.com/d/1akTNV7cetSec2KU_AnnoRZpA-Ja2cg3F"
    ]
  },
  "m3-cs": {
    "1": [
      "https://lh3.googleusercontent.com/d/1iDBIQFeHPVFm7rZWZeliO9Eu9VSAuAXM",
      "https://lh3.googleusercontent.com/d/1nz13JVSLqlu-dWv2dX4yVItQCqnr1mCz",
      "https://lh3.googleusercontent.com/d/1Fih-2F37aDnm4HdIcVMcxwNVaEKzgld1",
      "https://lh3.googleusercontent.com/d/1_6pyBHbMGj5-v7SLeHtBZn1aAWXw__vs",
      "https://lh3.googleusercontent.com/d/1WdcLBbIBkw_QsHUdnWuDRhSgqM-orDL2",
      "https://lh3.googleusercontent.com/d/1Lr9m30_YaudYDGMT19MRZitBMSwf_O-g"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1Ywqkv6W8prhCCq_sUCXbr73M2TvHUnme",
      "https://lh3.googleusercontent.com/d/12wQ8GyAB_kfBKczbVqiBXH6yW-ptKQGi",
      "https://lh3.googleusercontent.com/d/1wBx1bV1YdLFKfqmGFffRjERlKrgqV6zp",
      "https://lh3.googleusercontent.com/d/1OTDpfBF3L5r6pXXJQ26EWK4r54t69_J9",
      "https://lh3.googleusercontent.com/d/1vBkvDhW0iVyyAp7oTQzrO9O6Gk3D03W-",
      "https://lh3.googleusercontent.com/d/1ra7-6zfCam_6Rxaf8WVZ2zY8Wr_qtJUG"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1JC8L31giJvNVDdRdEjRaKbMGn3789TXM",
      "https://lh3.googleusercontent.com/d/1eoIK9iNzEgZ6yL0QiKd05Rh7rrJyXTyS",
      "https://lh3.googleusercontent.com/d/1R-2kC4RHFsAVFaLsRFcTHQ3e2GhPlqtR",
      "https://lh3.googleusercontent.com/d/19uFgbJuC4fxi1_u4MhAdWXtzSbq2PO_e",
      "https://lh3.googleusercontent.com/d/1G9IdCoyX8csuMjFeQoiWoogHIMxazzRO",
      "https://lh3.googleusercontent.com/d/15AeZSbtVnCTV7PqjnW0OrYInkCBaUlcE"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/11L4gvvFL-nr1Qy5E2bC7fIFe7KTihPwf",
      "https://lh3.googleusercontent.com/d/1NzK8Z2WTE2i6LIVtzmTsU7BJi03KOv7C",
      "https://lh3.googleusercontent.com/d/1vvRZL0Z6ruH_0tGEtpKXIhDwUmZOoKfw",
      "https://lh3.googleusercontent.com/d/1NOPDpEn-JTh7XGplqDn0pVCL1KhGhLso",
      "https://lh3.googleusercontent.com/d/1olloNBT3vl4nU0y0WVSue7gsOLcq9Wfd",
      "https://lh3.googleusercontent.com/d/1M9rf2ee55NEL1Ic7SqHSYVwBi_Y7hgL5"
    ]
  },
  "p1": {
    "1": [
      "https://lh3.googleusercontent.com/d/1nLS0sW66lZbuM2PKiAZXQ3Qt_ag6ZRBm",
      "https://lh3.googleusercontent.com/d/1nH5uF-SbzDJodrnji-OBp3yE-6T1ON9G",
      "https://lh3.googleusercontent.com/d/1j1-voJq_iF0JPwsWs1fK1h_3vQYR8hPR",
      "https://lh3.googleusercontent.com/d/1FBHYwh84TItMDUchswxnNX1aiWcXCT65",
      "https://lh3.googleusercontent.com/d/14BHd8RDFn2rqzN4oPUMgCoPpvJ3CXoiQ",
      "https://lh3.googleusercontent.com/d/1LHhHRs7KJ_26sRsQQWQVNf4hgZ5zyDZe"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1qr8swhhUgIphAzPJKFs78-hy86MWuYMN",
      "https://lh3.googleusercontent.com/d/1VCGQwMmlSsCBKjC4_q7iuU67ggrpQcwq",
      "https://lh3.googleusercontent.com/d/1VOBRcv908mgNAGny74-nUO5FLj9ClXEE",
      "https://lh3.googleusercontent.com/d/1U1mhhkBsW0eBJT1Od0bhN-unJF9Rxhs3",
      "https://lh3.googleusercontent.com/d/1osazQ0WUf0PO_KR_hteK9YgxC7ZeIwcK",
      "https://lh3.googleusercontent.com/d/1hNxsP5h_zehWqOGXA066Fdhz-Fdv6Shz"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1TJjGyuz5L5aLRc5zjzT6FuBBKBfk709H",
      "https://lh3.googleusercontent.com/d/1lDabyhnc0ed-GyJIOh-7-QFveQlbMu3z",
      "https://lh3.googleusercontent.com/d/1wpCpA0mVe43cKDt9r3DVU8F0f4LA-2Np",
      "https://lh3.googleusercontent.com/d/1n4BzoSajfKOnSF2YJDjnBXOBpRRH9VP1",
      "https://lh3.googleusercontent.com/d/1C7TDGDOxQZU3jGt4JnQH_9OiZkM2Kvih",
      "https://lh3.googleusercontent.com/d/16MW168aJQlMmjue4Xwh6FR-b8xf7Ys5T"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1mSZMYc3zgqqa73Tarq5mvZHbPpdtmU5y",
      "https://lh3.googleusercontent.com/d/1hfFSAFfIPQigSzploRq8JV3lLOk9Z6TC",
      "https://lh3.googleusercontent.com/d/1FgUDmTSBklkMIhmhk-8aZALfK1IrhEpH",
      "https://lh3.googleusercontent.com/d/1aXQ_dyqL6kHIgt_XuG6gvO-0OurFuZCA",
      "https://lh3.googleusercontent.com/d/177sR6n1JqmLQDhtp3oERAeEklh-ICwvP",
      "https://lh3.googleusercontent.com/d/1ljOGn_LQCulcIkeo6DRbWpIBj1x8FDxh"
    ]
  },
  "p2": {
    "1": [
      "https://lh3.googleusercontent.com/d/1SZ667uS3eK2F8SbWSYiXYhTilMlGnfS2",
      "https://lh3.googleusercontent.com/d/1_cDhnRkYLdsXdrwoeFwX6x_iTvhXaf0k",
      "https://lh3.googleusercontent.com/d/1VMqNyBqw0SoghVML77FuaiLPnNa-9Shy",
      "https://lh3.googleusercontent.com/d/1iBtsPLMJXzT8YYOMwRxpTxw5lGsQuouk",
      "https://lh3.googleusercontent.com/d/1eost-RR4S4r5KIaVk_9pWFyhhDqPAz1A",
      "https://lh3.googleusercontent.com/d/1zgBpnSpyI-ETUDk4rIuRf9itdexGs4uU"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1NHEu7de4sJHCQzZ-_ZbB5StA582XEvWv",
      "https://lh3.googleusercontent.com/d/1ERzcIuZQaYAshXO6VKMZ9ty3vPlvT0uu",
      "https://lh3.googleusercontent.com/d/1DVuhDcamitIsoqXtAFL-7dGGHSdynWSA",
      "https://lh3.googleusercontent.com/d/1VdX7JwKnt_DgubgggbjtsFsiTnnFUfwI",
      "https://lh3.googleusercontent.com/d/1KBxLqgpjnbaMTTF39WUhuploJA64m-6y",
      "https://lh3.googleusercontent.com/d/1JRQ3JsknVSiVgQpRhL1NF9tSYCmeaZZR"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1ZNhhNCEmUzaHj4L4LFKzEXXHRuS2kGdQ",
      "https://lh3.googleusercontent.com/d/1hupLOBrDxeqj2SWGAP5o3b8jMu2cMHK_",
      "https://lh3.googleusercontent.com/d/1WYbrFpxHVF2fuyzAQyh2DnjobbkWhlxN",
      "https://lh3.googleusercontent.com/d/1KD2PiVBiL58TKyE-5BKCEaAP0ONc1dYu",
      "https://lh3.googleusercontent.com/d/155uR8aZzh8DnVMzkiAEk-IwGCOJN564S",
      "https://lh3.googleusercontent.com/d/1LPeCZydKaF-KLh5F6HmtSvG6QkrkUE9c"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1F2Bmw2WbbFqczH1zsRVWX4oDWLY-PxNa",
      "https://lh3.googleusercontent.com/d/1Jshtfvt-MrNPOHbeko2hB-7Yx2U5d_ql",
      "https://lh3.googleusercontent.com/d/1TBgq-UH24k2X3T8eX51dOT1MFsw9Avuk",
      "https://lh3.googleusercontent.com/d/1N9TN1G2aAec_z6-v7uJlNc9VLNC-XDb3",
      "https://lh3.googleusercontent.com/d/1yWBBKJDs_xjIei36kK4ijGeU9CFwRLdm",
      "https://lh3.googleusercontent.com/d/1pz7LV-1wkupLba21gr0D-TR_2iNG8fE5"
    ]
  },
  "p3": {
    "1": [
      "https://lh3.googleusercontent.com/d/1t4aTUP3cCeMfPjDq1ORVowVg3Bs4vurV",
      "https://lh3.googleusercontent.com/d/16xZk8GtbzyeIADpemRQigWc3a2VMfoyV",
      "https://lh3.googleusercontent.com/d/1i3woJou0-EWh6VwtfqwotZzoEshQwzFl",
      "https://lh3.googleusercontent.com/d/1CCeozTCUoVY1DjCREVIdmv6HWXCjuyb9",
      "https://lh3.googleusercontent.com/d/1JCkQbvqX0eSJl0umPxEvd_ncOaQJgfFd",
      "https://lh3.googleusercontent.com/d/1dfQA4XFqpbwl-K3ynFxEhQu8hlVIiFdP"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/10UPC_3_k1T8pqo2jl636g7hYCQr7U04t",
      "https://lh3.googleusercontent.com/d/1R-9d1qdm23-AXhRlVRe4f8wPYu-zEqAn",
      "https://lh3.googleusercontent.com/d/1RlycJo2X8n8-QzQ_BNl6pxKd-AUxRNdq",
      "https://lh3.googleusercontent.com/d/1KzGwqp8yzHcnqiw8BYpzCm66G1LZKDmm",
      "https://lh3.googleusercontent.com/d/1Gr2AnCPyV4sIz9GryyE4lhG3nXlwitJc",
      "https://lh3.googleusercontent.com/d/16KTmM4TrEmwf-1F5lQiFyn-WSxfJBeq5"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1XMZ5uQwVUHIayn1D6Dyo7ICMDhQLe2WG",
      "https://lh3.googleusercontent.com/d/1sMtATsyf10SyfhyDl5RLt5XQIFhuWcea",
      "https://lh3.googleusercontent.com/d/18mHCERJknr-uAzzocYLwlBYdvKg3N_fn",
      "https://lh3.googleusercontent.com/d/1GlKRyDkzaHpNToeKaLoMcHRyuJoq-CXl",
      "https://lh3.googleusercontent.com/d/18LUB8-vf5wZDNz0W_hPLnnL8i7PsZmZO",
      "https://lh3.googleusercontent.com/d/148XZf7cG7DjuBYmDOxFOK5akghG4K7pS"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1h8rrD74mD7uu9ZVxE0qNSQ-NNj2Tlys6",
      "https://lh3.googleusercontent.com/d/1VeKH_wvdVz2SbHGli_u3nx6OrR6v2q1X",
      "https://lh3.googleusercontent.com/d/1kGjjSPnFrMbGY9j42fZHap-juScZU6PE",
      "https://lh3.googleusercontent.com/d/1KGKv-uxV0vnFMmWsrTQ0j9OVqecxK0W6",
      "https://lh3.googleusercontent.com/d/1GqtucJ0FlvWoPRFLLsl-L18o7VW0BMM5",
      "https://lh3.googleusercontent.com/d/1BtMzU9_pRKoln3CpSLQqaOSQSNOLu-ps"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1r-AkTL4zf8hGXEm18j8VvMXi0qHij2GA",
      "https://lh3.googleusercontent.com/d/1GveSUkrgc6cQX9q0ohGgUVj1gdghMusC",
      "https://lh3.googleusercontent.com/d/1xjyVmzXqP7nGyxWxwvMcV5hS5-SJRZAX",
      "https://lh3.googleusercontent.com/d/1RJHeYWYEsD7oypvH7aaCk1821fU2Q91p",
      "https://lh3.googleusercontent.com/d/16DeZkJlku_MHt-N391HRQ1L2yH1UnTRp",
      "https://lh3.googleusercontent.com/d/1YzGmcbIffr55GImDWle7ybP4kbmbXlvs"
    ]
  },
  "p4": {
    "1": [
      "https://lh3.googleusercontent.com/d/1X3-z-ECheFxHRKsDK-VW8awtbndQgp2o",
      "https://lh3.googleusercontent.com/d/1cQZ31E4QwiLEVZuXxnDpLz5C0UQV0E7L",
      "https://lh3.googleusercontent.com/d/19kgqIOJdX1g730QzyezNhp9AW-NmpVoM",
      "https://lh3.googleusercontent.com/d/1Zrf4FB_Ka4Z5I8GPD2_UrHXM42A3Y2lA",
      "https://lh3.googleusercontent.com/d/19DNaohwvcbbu6dcRwQEmdL1s-a-Aa0L6",
      "https://lh3.googleusercontent.com/d/1uRGmnoDlvNz-YLv4TJBARqvKnrdt0q91"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1aVZdGanZoY7LWTjzeW1f0sDzJU56uEBG",
      "https://lh3.googleusercontent.com/d/1vjSrdARyXlGDsClvtjrV5gS23mTfyx0m",
      "https://lh3.googleusercontent.com/d/1XorEB19b-q9pe8nrvyqN2NZdIYZSfQtq",
      "https://lh3.googleusercontent.com/d/1YzZlU7gQyA0ScpIFiFG41jtuiDKN_ze_",
      "https://lh3.googleusercontent.com/d/1FZpHPUrDJ1u6w7Gh9qUaQiI1TA78FtVe",
      "https://lh3.googleusercontent.com/d/1AcJXdR05KC2RKdF4_khWUrzRjf6G-BP9"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1l4EOTMtrlnDxpqkLuoQPdHvu8OKbV_KM",
      "https://lh3.googleusercontent.com/d/1MecC5J_hmKHeFrrHqlJYgk0pNjHJFvtk",
      "https://lh3.googleusercontent.com/d/1GdkooBgRVNbLS61g8E2uDKhHOFpSpw9w",
      "https://lh3.googleusercontent.com/d/1bbqiiGfJD5h4tSUUAb_VuXyDBWA_nUvt",
      "https://lh3.googleusercontent.com/d/1uCedSFGWN-DxWWQ1mJxtHAtz1RW5UScE",
      "https://lh3.googleusercontent.com/d/1wEr2dtH6XojCpq6fh0KQCbQRqb9IA3Uw"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1uU5n7H40qYmdM05XJogvrzjJLO-PVOQt",
      "https://lh3.googleusercontent.com/d/1TesDN7BOl8n-2iBuAWgJAxM6ZpksRRe_",
      "https://lh3.googleusercontent.com/d/1Sehn-1AxUkPv7vsn-D4xSKhbHHFTgrZA",
      "https://lh3.googleusercontent.com/d/126V8z9b2T0_lqmGAVl-rvK8sr5Csd7U1",
      "https://lh3.googleusercontent.com/d/1Gs7Hkozr5Dt2ATsdsgmr-8NY-wtK9Mrn",
      "https://lh3.googleusercontent.com/d/1boNyV7LjsOuembPtSAt1dXHn-v7Q_CNf"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1guN_W5oApMLBEf7uLecswJre1JiyMiVs",
      "https://lh3.googleusercontent.com/d/1a7bhRcwSGzOMmkvJqAL3KS7JwOJNWoz4",
      "https://lh3.googleusercontent.com/d/15S3v5GpGDQg4pXXqhMJrhcj6t_eoLdNp",
      "https://lh3.googleusercontent.com/d/1PXdot8B6_IY92n0C4Hh59etmH4Zb6Bem",
      "https://lh3.googleusercontent.com/d/1kEPXjepM9cuByJqWxn8lOe0lYfbt8Ewo",
      "https://lh3.googleusercontent.com/d/1I9Oz0jcMZ6mFRRPQGTzYe_qL1VqRkN7K"
    ]
  },
  "p5": {
    "1": [
      "https://lh3.googleusercontent.com/d/1PycSsknGSKDV5SwU6Nn5J1hdFEeprwC1",
      "https://lh3.googleusercontent.com/d/11amu0M-ihmtUwLIusVvhAJrjWe-DcL9f",
      "https://lh3.googleusercontent.com/d/1Qrhx2fdoyR9T8-nm0bnpdJmTIhncR6WT",
      "https://lh3.googleusercontent.com/d/1yE4QQse87c3cA_U-uu60MnIHLjXvJ5Wc",
      "https://lh3.googleusercontent.com/d/1i9JIeObh9nvVX0KZGX3FY6sByhJtC0JU",
      "https://lh3.googleusercontent.com/d/19b9aWYMKMWR66Im7djQLw4e43_0mUMKZ"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1XfuM0q_-qzRWTCQLdHv6k0Ff9Blmq2Kz",
      "https://lh3.googleusercontent.com/d/1RqBNXAl7LicRcnJX81arqE2bw0Ls88xs",
      "https://lh3.googleusercontent.com/d/1tDYaP2j3RLUSKew6TeoZRvZVTTESYn6S",
      "https://lh3.googleusercontent.com/d/1VGoYzYzaO8ZUHSKj2fyVUbnYE669g3Lh",
      "https://lh3.googleusercontent.com/d/1DDltBdH7w9DZqi627wWgRxwwHdgi3ZVt",
      "https://lh3.googleusercontent.com/d/1YYtcHkLRfAZABSgxMY1chnmRCH2EDNWY"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1heuXh0GpkEN5FMIRH4aexvxVi0hJYt_i",
      "https://lh3.googleusercontent.com/d/1tkdXcX5QnOqBkWYtE-y4buy2-1J6v1GE",
      "https://lh3.googleusercontent.com/d/1CTDTU9xrrxSVewss63T3dfPuMVReM9sD",
      "https://lh3.googleusercontent.com/d/1V9_GWEZzQndJ28DT8aUtKeEPmf5fOrJu",
      "https://lh3.googleusercontent.com/d/1vqK9ZqBuUnTIIIljQrNKqWGO8twieowz",
      "https://lh3.googleusercontent.com/d/1If4sQDJuuMlf8XFOoT1FPieVc3fHZkSx"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/17Fd0AsuOGalAinjjvuO23d2v4ze3Aiyc",
      "https://lh3.googleusercontent.com/d/14nadVhSNn64lOB3FHs7DjSbmD_5sMSOD",
      "https://lh3.googleusercontent.com/d/1Xq4qV6l5fL8XJs1DIR79PFJ0Lg3yD8lD",
      "https://lh3.googleusercontent.com/d/1TyXMYb4-0YtDVpZxa9UUr5FP4jUWz8s7",
      "https://lh3.googleusercontent.com/d/1h5CUAy3Vv5Jx8ZwjoFO_usCt2Yh0Vd9t",
      "https://lh3.googleusercontent.com/d/1erJAxb8LleVW-3GpB4LMiDfOx--OXpbV"
    ]
  },
  "p6": {
    "1": [
      "https://lh3.googleusercontent.com/d/1L4k2QcV12o7_Wsu60_ep7m6GaXU4sD9r",
      "https://lh3.googleusercontent.com/d/1ZOkv_1W_iigyCRnRlOKFb79UIJtxVOVM",
      "https://lh3.googleusercontent.com/d/19WINdPCDpRQuak-SK-nRYJZopekwa_2I",
      "https://lh3.googleusercontent.com/d/139Tk6W4h1XZAGymyhSfWUIiagWYhd2gE",
      "https://lh3.googleusercontent.com/d/1eA6qRmkJe-76Iwd4bgk-CdPhasgbt9Vj",
      "https://lh3.googleusercontent.com/d/1uCUUyYRGykNmKxWnNoU5FARWrBl9lzj0"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1mUNQaadvq3jPinmk5Q7nsb-IT4EnQUz-",
      "https://lh3.googleusercontent.com/d/1AM5UHZA6S-6Zka5B_AWg4divhGz8UsZg",
      "https://lh3.googleusercontent.com/d/1Uuu_WsvqDRZoEUq4TCuR7lzV9rz-fXCJ",
      "https://lh3.googleusercontent.com/d/1PGVPjkQBXypZ4eLkVkE_t6iU6bNCQcZR",
      "https://lh3.googleusercontent.com/d/1jHbZPsWZk9bqu_GdDoCo24kT-ba8RkAI",
      "https://lh3.googleusercontent.com/d/1-k1Ddtfq7CZW3Ek3z3mUsUraIlOmrJmG"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/15DsjQmQX2C9v5LVdNPWIIikM1QcMuE9t",
      "https://lh3.googleusercontent.com/d/1oF0kXRx8lBARBAhG5h-BGdbSvR_rymqX",
      "https://lh3.googleusercontent.com/d/13xwMC5iwS5ecBKV3CFVE9vhMG4khvD-a",
      "https://lh3.googleusercontent.com/d/1E9cNWWrZwu0sxSJkQHKwOIYJ04jJ1Pa6",
      "https://lh3.googleusercontent.com/d/1QYPeGaYEA7KvQ9stodAwLq8Hb1wN3NXf",
      "https://lh3.googleusercontent.com/d/18nq5dlzWlPZPQmE4-BQwWz9Rqn9sivYR"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1983AZvjl9xhd5XfmJz-RByblHJ8AisQU",
      "https://lh3.googleusercontent.com/d/14sd2H0gWoyY1CnVme41rGSfM1WtxDNnl",
      "https://lh3.googleusercontent.com/d/1BwPbItUuMHRh13a-LMEOLiejceSke4EY",
      "https://lh3.googleusercontent.com/d/1_HvvOVJ4M6LDW0DcDzTzcq1NLWk98nG1",
      "https://lh3.googleusercontent.com/d/1ctuQmJgrReOG1QKk-eVXptyReNxxui-b",
      "https://lh3.googleusercontent.com/d/1emTVU1TUFwqwoVfxRYJNODq2WF0KbMa8"
    ]
  },
  "ai-p1-3": {
    "1": [
      "https://lh3.googleusercontent.com/d/1bbUeax96RunLcFtCPGw4I5sR7B3HA2QT",
      "https://lh3.googleusercontent.com/d/1y1iwxU4b1SygbFRUTe7zGDaVYX4N_pfb",
      "https://lh3.googleusercontent.com/d/1OP8fWBpWYy0z5_NVqAdxryagNPnwRi0z",
      "https://lh3.googleusercontent.com/d/1TIuOfV5AgyNLSDzUW7L_jeFXkLxncdWJ",
      "https://lh3.googleusercontent.com/d/1DjgCKghw9PbNawZmBAcXFjxwciKtrJWt"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1TCuYTTIwm2cpohEXe_eHfDExK7uckhhx",
      "https://lh3.googleusercontent.com/d/13nJsaX4bkNR_vZy37GAzbBxPZbkiafyg",
      "https://lh3.googleusercontent.com/d/19SQglttvZACnE2iYpwcUC3VeOTEuwgu_",
      "https://lh3.googleusercontent.com/d/1CxvQFI-fZnNotaY2IX59c4o4io0qBVI5",
      "https://lh3.googleusercontent.com/d/1l9-A5Xy6ZjPR2lGx9Q43ecLNzW8x36Gi"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1fYT8Qx5rKsUc_LBj9IzpF6NR1ZR3_atB",
      "https://lh3.googleusercontent.com/d/1l0OpVBpRbnEJios-tqSSAYMVV9UIRrKY",
      "https://lh3.googleusercontent.com/d/1LzSj5c-byGt0-Xv772sCNwrdIicvJHQt",
      "https://lh3.googleusercontent.com/d/1bTlGgf3Xfl-NXxZ6A0AX1_74qhTwhYO-",
      "https://lh3.googleusercontent.com/d/1MY2WQMAl-jWyA1JbVfbTY6GDZd3Sv_wz"
    ]
  },
  "ai-p4-6": {
    "4": [
      "https://lh3.googleusercontent.com/d/1a0sfzF_Xn_KNfGqqoGgaNLmAne2LIVAQ",
      "https://lh3.googleusercontent.com/d/1GmZza-GnxY4QJaz5Ry8_KrCVmat3uyVX",
      "https://lh3.googleusercontent.com/d/1jLrhJUTckVhmcOdh046kSQoOI7fG4Ntk",
      "https://lh3.googleusercontent.com/d/1BqnnLmiZQ2BdwQpufO0hYvwTibvC6W1k",
      "https://lh3.googleusercontent.com/d/1D8YaDN4gK3HDv-8eqtrF9UJ1bAeSF9pa"
    ],
    "3": [
      "/slides/ai-p4-6/3/01_สไลด์_Generative_AI__รทนเครองมอสรางสรรค.png",
      "/slides/ai-p4-6/3/02_สไลด์_Generative_AI_คออะไร.png",
      "/slides/ai-p4-6/3/03_สไลด์_ใช_ChatGPTGemini_อยางฉลาด.png",
      "/slides/ai-p4-6/3/04_สไลด์_AI_ผดได_Hallucination.png",
      "/slides/ai-p4-6/3/05_สไลด์_ลองเลน_Generative_AI_ฟร.png"
    ],
    "1": [
      "/slides/ai-p4-6/1/01_สไลด์_AI_กบ_Machine_Learning_เบองตน.png",
      "/slides/ai-p4-6/1/02_สไลด์_AI__ML.png",
      "/slides/ai-p4-6/1/03_สไลด์_ประเภทของ_Machine_Learning.png",
      "/slides/ai-p4-6/1/04_สไลด์_ML_ในชวตจรง.png",
      "/slides/ai-p4-6/1/05_สไลด์_ขอมลคอสงสำคญทสด.png"
    ],
    "2": [
      "/slides/ai-p4-6/2/01_สไลด์_สรางโมเดล_AI_ของตวเอง.png",
      "/slides/ai-p4-6/2/02_สไลด์_Teachable_Machine__เครองมอสราง_AI.png",
      "/slides/ai-p4-6/2/03_สไลด์_ขนตอนสรางโมเดล_AI.png",
      "/slides/ai-p4-6/2/04_สไลด์_Project_AI_จำแนกอารมณ.png",
      "/slides/ai-p4-6/2/05_สไลด์_ทำไมโมเดลของเราตองด.png"
    ]
  },
  "ai-m1-3": {
    "1": [
      "/slides/ai-m1-3/1/01_สไลด์_AI_Foundations__รากฐานปญญาประดษฐ.png",
      "/slides/ai-m1-3/1/02_สไลด์_ประวต_AI_โดยยอ.png",
      "/slides/ai-m1-3/1/03_สไลด์_AI_vs_ML_vs_Deep_Learning.png",
      "/slides/ai-m1-3/1/04_สไลด์_Neural_Network_เลยนแบบสมอง.png",
      "/slides/ai-m1-3/1/05_สไลด์_Dataset__TrainTest_Split.png"
    ],
    "2": [
      "/slides/ai-m1-3/2/01_สไลด์_Computer_Vision__NLP.png",
      "/slides/ai-m1-3/2/02_สไลด์_Computer_Vision_CV.png",
      "/slides/ai-m1-3/2/03_สไลด์_NLP__Natural_Language_Processing.png",
      "/slides/ai-m1-3/2/04_สไลด์_Speech_Recognition__TTS.png",
      "/slides/ai-m1-3/2/05_สไลด์_Project_ใช_Hugging_Face_Spaces.png"
    ],
    "3": [
      "/slides/ai-m1-3/3/01_สไลด์_Prompt_Engineering__ศาสตรการสงงาน_A.png",
      "/slides/ai-m1-3/3/02_สไลด์_Prompt__คำสงทสงให_AI.png",
      "/slides/ai-m1-3/3/03_สไลด์_4_องคประกอบของ_Prompt_ทด.png",
      "/slides/ai-m1-3/3/04_สไลด์_เทคนค_Prompt_ขนสง.png",
      "/slides/ai-m1-3/3/05_สไลด์_ใช_AI_ในการเรยนอยางมจรยธรรม.png"
    ],
    "4": [
      "/slides/ai-m1-3/4/01_สไลด์_AI_Ethics__Bias.png",
      "/slides/ai-m1-3/4/02_สไลด์_Bias_เกดจากอะไร.png",
      "/slides/ai-m1-3/4/03_สไลด์_กรณศกษาจรง__AI_ทผดพลาด.png",
      "/slides/ai-m1-3/4/04_สไลด์_กฎหมาย_AI_ในประเทศไทย.png",
      "/slides/ai-m1-3/4/05_สไลด์_หลกการ_Responsible_AI.png"
    ],
    "5": [
      "/slides/ai-m1-3/5/01_สไลด์_โครงงาน_AI__แกปญหาในชวตจรง.png",
      "/slides/ai-m1-3/5/02_สไลด์_ขนตอนทำโครงงาน_AI.png",
      "/slides/ai-m1-3/5/03_สไลด์_ไอเดยโครงงานสำหรบ_มตน.png",
      "/slides/ai-m1-3/5/04_สไลด์_การนำเสนอผลงาน_AI.png",
      "/slides/ai-m1-3/5/05_สไลด์_AI_สรางโดยคณ__เรมไดวนน.png"
    ]
  },
  "arduino-basic": {
    "1": [
      "/slides/arduino-basic/1/01_สไลด์_Arduino_คอสมองของงานอเลกทรอนกส.png",
      "/slides/arduino-basic/1/02_สไลด์_ไมโครคอนโทรลเลอรทำงานอยางไร.png",
      "/slides/arduino-basic/1/03_สไลด์_Arduino_ตางจากคอมพวเตอรอยางไร.png",
      "/slides/arduino-basic/1/04_สไลด์_เอาไปทำอะไรไดบาง.png",
      "/slides/arduino-basic/1/05_สไลด์_ของทตองเตรยม.png",
      "/slides/arduino-basic/1/06_สไลด์_ตรวจความเขาใจ.png"
    ],
    "2": [
      "/slides/arduino-basic/2/01_สไลด์_ตดตง_Arduino_IDE_และโปรแกรมแรก.png",
      "/slides/arduino-basic/2/02_สไลด์_3_อยางทตองตงคาทกครง.png",
      "/slides/arduino-basic/2/03_สไลด์_โครงสรางโปรแกรม_Arduino.png",
      "/slides/arduino-basic/2/04_สไลด์_ทดลอง_Blink_ดวยตวเอง.png",
      "/slides/arduino-basic/2/05_สไลด์_แกปญหาอปโหลดไมได.png",
      "/slides/arduino-basic/2/06_สไลด์_ตรวจความเขาใจ.png"
    ],
    "3": [
      "/slides/arduino-basic/3/01_สไลด์_รจกขาบน_Arduino_UNO.png",
      "/slides/arduino-basic/3/02_สไลด์_ขาสำคญบนบอรด_UNO.png",
      "/slides/arduino-basic/3/03_สไลด์_ตอ_LED_ใหถกวธ.png",
      "/slides/arduino-basic/3/04_สไลด์_ดจทล_กบ_แอนะลอก.png",
      "/slides/arduino-basic/3/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "4": [
      "/slides/arduino-basic/4/01_สไลด์_คำสงหลกทใชบอยทสด.png",
      "/slides/arduino-basic/4/02_สไลด์_สงงานขา_output.png",
      "/slides/arduino-basic/4/03_สไลด์_อานคาจาก_input.png",
      "/slides/arduino-basic/4/04_สไลด์_Serial_Monitor_คอเครองมอหาบก.png",
      "/slides/arduino-basic/4/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "5": [
      "/slides/arduino-basic/5/01_สไลด์_เซนเซอร_มอเตอร_และจอแสดงผล.png",
      "/slides/arduino-basic/5/02_สไลด์_เซนเซอรทใชบอยในใบงาน.png",
      "/slides/arduino-basic/5/03_สไลด์_ตวอยางจรง_ไฟตดเองเมอมด.png",
      "/slides/arduino-basic/5/04_สไลด์_มอเตอรตองระวงเรองไฟ.png",
      "/slides/arduino-basic/5/05_สไลด์_บนทกผลแบบนกทดลอง.png",
      "/slides/arduino-basic/5/06_สไลด์_ตรวจความเขาใจ.png"
    ],
    "6": [
      "/slides/arduino-basic/6/01_สไลด์_จำลองวงจรและแกปญหาบอรด.png",
      "/slides/arduino-basic/6/02_สไลด์_จำลองวงจรกอนตอจรง.png",
      "/slides/arduino-basic/6/03_สไลด์_บตโหลดเดอรคออะไร.png",
      "/slides/arduino-basic/6/04_สไลด์_ไลแกปญหาอยางเปนระบบ.png",
      "/slides/arduino-basic/6/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "7": [
      "/slides/arduino-basic/7/01_สไลด์_แสดงผลบนจอ_LCD.png",
      "/slides/arduino-basic/7/02_สไลด์_ทำไมตองใช_I2C.png",
      "/slides/arduino-basic/7/03_สไลด์_โคดแสดงขอความบนจอ.png",
      "/slides/arduino-basic/7/04_สไลด์_แสดงผลใหอานงาย.png",
      "/slides/arduino-basic/7/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "8": [
      "/slides/arduino-basic/8/01_สไลด์_โครงงาน_Arduino_ปลายคอรส.png",
      "/slides/arduino-basic/8/02_สไลด์_เรมจากปญหา_ไมใชจากอปกรณ.png",
      "/slides/arduino-basic/8/03_สไลด์_ออกแบบดวย_Input-Process-Output.png",
      "/slides/arduino-basic/8/04_สไลด์_ทดสอบแลวปรบจากหลกฐาน.png",
      "/slides/arduino-basic/8/05_สไลด์_นำเสนอใหนาเชอถอ.png",
      "/slides/arduino-basic/8/06_สไลด์_ตรวจความพรอมกอนสง.png"
    ]
  },
  "electronics-basic": {
    "1": [
      "/slides/electronics-basic/1/01_สไลด์_อเลกทรอนกสอยรอบตวเรา.png",
      "/slides/electronics-basic/1/02_สไลด์_อเลกทรอนกสคออะไร.png",
      "/slides/electronics-basic/1/03_สไลด์_แอนะลอก_กบ_ดจทล.png",
      "/slides/electronics-basic/1/04_สไลด์_มองทกอปกรณเปน_3_สวน.png",
      "/slides/electronics-basic/1/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "2": [
      "/slides/electronics-basic/2/01_สไลด์_กฎของโอหม_หวใจของทกวงจร.png",
      "/slides/electronics-basic/2/02_สไลด์_V__I__R.png",
      "/slides/electronics-basic/2/03_สไลด์_คำนวณตวตานทานให_LED.png",
      "/slides/electronics-basic/2/04_สไลด์_กำลงไฟฟา_P__V__I.png",
      "/slides/electronics-basic/2/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "3": [
      "/slides/electronics-basic/3/01_สไลด์_อปกรณพนฐานทตองรจก.png",
      "/slides/electronics-basic/3/02_สไลด์_ตวเกบประจและไดโอด.png",
      "/slides/electronics-basic/3/03_สไลด์_ทรานซสเตอรทำอะไรได.png",
      "/slides/electronics-basic/3/04_สไลด์_สะพานเชอมกบโลกจรง.png",
      "/slides/electronics-basic/3/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "4": [
      "/slides/electronics-basic/4/01_สไลด์_วงจรแอนะลอกและแหลงจายไฟ.png",
      "/slides/electronics-basic/4/02_สไลด์_จากไฟบานสไฟทวงจรใชได.png",
      "/slides/electronics-basic/4/03_สไลด์_วงจร_RC_กรองสญญาณ.png",
      "/slides/electronics-basic/4/04_สไลด์_ระวงเรองความปลอดภย.png",
      "/slides/electronics-basic/4/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "5": [
      "/slides/electronics-basic/5/01_สไลด์_วงจรดจทลและลอจกเกต.png",
      "/slides/electronics-basic/5/02_สไลด์_เลขฐานสอง.png",
      "/slides/electronics-basic/5/03_สไลด์_ลอจกเกตพนฐาน.png",
      "/slides/electronics-basic/5/04_สไลด์_คอมบเนชน_กบ_ซเควนเชยล.png",
      "/slides/electronics-basic/5/05_สไลด์_ตรวจความเขาใจ.png"
    ],
    "6": [
      "/slides/electronics-basic/6/01_สไลด์_มลตมเตอรและการตรวจวงจร.png",
      "/slides/electronics-basic/6/02_สไลด์_มลตมเตอรวดอะไรไดบาง.png",
      "/slides/electronics-basic/6/03_สไลด์_กฎของเคอรชอฟฟ.png",
      "/slides/electronics-basic/6/04_สไลด์_ไลตรวจวงจรอยางเปนระบบ.png",
      "/slides/electronics-basic/6/05_สไลด์_ตรวจความเขาใจ.png"
    ]
  },
  "python-basic": {
    "1": [
      "/slides/python-basic/1/01_สไลด์_เรมตนกบ_Python.png",
      "/slides/python-basic/1/01_สไลด์_เริ่มต้นกับ_Python_ฉบับครูเจมส์.png",
      "/slides/python-basic/1/02_สไลด์_ทำไมต้อง_Python_และประวัติความเป็นมา.png",
      "/slides/python-basic/1/02_สไลด์_เขยน_Python_ไดทไหนบาง.png",
      "/slides/python-basic/1/03_สไลด์_การติดตั้ง_Python_และ_VS_Code.png",
      "/slides/python-basic/1/03_สไลด์_สองโหมดของการรนโปรแกรม.png",
      "/slides/python-basic/1/04_สไลด์_print__สงใหคอมพวเตอรพด.png",
      "/slides/python-basic/1/04_สไลด์_คำสั่ง_print_และ_input.png",
      "/slides/python-basic/1/05_สไลด์_input__สงใหคอมพวเตอรฟง.png",
      "/slides/python-basic/1/06_สไลด์_ตรวจความเขาใจ_แสดงผลและรบขอมล.png"
    ],
    "2": [
      "/slides/python-basic/2/01_สไลด์_ตวแปรและชนดขอมล.png",
      "/slides/python-basic/2/01_สไลด์_ปก_ตัวแปรและชนิดข้อมูล.png",
      "/slides/python-basic/2/02_สไลด์_สรางตวแปรดวยเครองหมาย.png",
      "/slides/python-basic/2/03_สไลด์_กตกาตงชอตวแปร.png",
      "/slides/python-basic/2/04_สไลด์_ชนดขอมลพนฐาน_3_แบบ.png",
      "/slides/python-basic/2/05_สไลด์_แปลงชนดขอมลกอนคำนวณ.png",
      "/slides/python-basic/2/06_สไลด์_ตรวจความเขาใจ_ตวแปรและชนดขอมล.png"
    ],
    "3": [
      "/slides/python-basic/3/01_สไลด์_ตวดำเนนการและโจทยคำนวณ.png",
      "/slides/python-basic/3/02_สไลด์_เครองหมายคำนวณ_7_ตว.png",
      "/slides/python-basic/3/03_สไลด์_บวกและคณกบขอความ.png",
      "/slides/python-basic/3/04_สไลด์_โจทย_ทอนเงนอยางไร.png",
      "/slides/python-basic/3/05_สไลด์_สตรทใชบอยในชวตจรง.png",
      "/slides/python-basic/3/06_สไลด์_ตรวจความเขาใจ_ตวดำเนนการ.png"
    ],
    "4": [
      "/slides/python-basic/4/01_สไลด์_วนซำดวย_for_และทางเลอกดวย_if.png",
      "/slides/python-basic/4/02_สไลด์_for__ทำซำตามจำนวนรอบ.png",
      "/slides/python-basic/4/03_สไลด์_เครองหมายเปรยบเทยบ.png",
      "/slides/python-basic/4/04_สไลด์_if_และ_else__ใหโปรแกรมตดสนใจ.png",
      "/slides/python-basic/4/05_สไลด์_ลองทำ_มากไปหรอนอยไป.png",
      "/slides/python-basic/4/06_สไลด์_ตรวจความเขาใจ_for_และ_if.png"
    ],
    "5": [
      "/slides/python-basic/5/01_สไลด์_เตาไพทอน_วาดรปดวยโคด.png",
      "/slides/python-basic/5/02_สไลด์_คำสงพนฐานของเตา.png",
      "/slides/python-basic/5/03_สไลด์_วาดสเหลยมดวยการวนซำ.png",
      "/slides/python-basic/5/04_สไลด์_สตรมมของรปหลายเหลยม.png",
      "/slides/python-basic/5/05_สไลด์_ฟงกชนวาดบาน.png",
      "/slides/python-basic/5/06_สไลด์_ตรวจความเขาใจ_เตาไพทอน.png"
    ],
    "6": [
      "/slides/python-basic/6/01_สไลด์_เงอนไขซบซอนและการวนซำดวย_while.png",
      "/slides/python-basic/6/02_สไลด์_and_or_not_รวมเงอนไข.png",
      "/slides/python-basic/6/03_สไลด์_if-elif-else_เมอมหลายทางเลอก.png",
      "/slides/python-basic/6/04_สไลด์_while__วนจนกวาเงอนไขจะเปนเทจ.png",
      "/slides/python-basic/6/05_สไลด์_โจทย_เลอกสตรพนทตามรป.png",
      "/slides/python-basic/6/06_สไลด์_ตรวจความเขาใจ_เงอนไขและ_while.png"
    ],
    "7": [
      "/slides/python-basic/7/01_สไลด์_ฟงกชน_ลสต_และโมดล.png",
      "/slides/python-basic/7/02_สไลด์_สรางฟงกชนดวย_def.png",
      "/slides/python-basic/7/03_สไลด์_return__สงผลลพธกลบมา.png",
      "/slides/python-basic/7/04_สไลด์_ลสต__เกบหลายคาในตวแปรเดยว.png",
      "/slides/python-basic/7/05_สไลด์_เรยกใชโมดลดวย_import.png",
      "/slides/python-basic/7/06_สไลด์_ตรวจความเขาใจ_ฟงกชน_ลสต_โมดล.png"
    ],
    "8": [
      "/slides/python-basic/8/01_สไลด์_วเคราะหขอมลและสราง_GUI_ม3.png",
      "/slides/python-basic/8/02_สไลด์_pandas_Series_และ_DataFrame.png",
      "/slides/python-basic/8/03_สไลด์_อานไฟล_CSV_แลวสรปขอมล.png",
      "/slides/python-basic/8/04_สไลด์_เชอมขอมลและวาดกราฟ.png",
      "/slides/python-basic/8/05_สไลด์_tkinter_หนาตางโปรแกรมแรกของเรา.png",
      "/slides/python-basic/8/06_สไลด์_ตรวจความเขาใจ_ขอมลและ_GUI.png"
    ]
  }
};

export const isLessonSlideImages: Record<number, string[]> = {
  "1": [
    "https://lh3.googleusercontent.com/d/1kUjgsXXH9ADMyFYUZCvmzdeBfowzi4Tc",
    "https://lh3.googleusercontent.com/d/10yaU6C04aXbgWzNNRc1nZ8vfeqGlDLZl",
    "https://lh3.googleusercontent.com/d/1rBkGwYKuK-P5lolvymJXCCVg93EiF9pU",
    "https://lh3.googleusercontent.com/d/1ksorRnY7mZIHjIUcqkFQcoPnqYM4_69R",
    "https://lh3.googleusercontent.com/d/1GvKPyA48glI5Vs6QxC-AyhQPt_S0L59x",
    "https://lh3.googleusercontent.com/d/1n9tS2GAm6bWNtfVKSqUpQMsI7jVhsDOG"
  ],
  "2": [
    "https://lh3.googleusercontent.com/d/1r3wLhOoLvT_GXgs5e5_F01YYFkQuFQiB",
    "https://lh3.googleusercontent.com/d/1Jdob0t6EcpaSOreX_SB9NOq9ac65LR3Z",
    "https://lh3.googleusercontent.com/d/1aI2BRUqmz0cm5vdkn5qjNR5Hz8e3ZH0h",
    "https://lh3.googleusercontent.com/d/1REyC-BX2gjmA0KwRL-25kPeCrOlWDBc0",
    "https://lh3.googleusercontent.com/d/1loGjXlXLTbJQyJ_Rjc-BbzW1DWxUqP3K",
    "https://lh3.googleusercontent.com/d/1RyedKgxiBiEhiw-Jcy08zHtGsDbiPrUf"
  ],
  "3": [
    "https://lh3.googleusercontent.com/d/1ArLJhQjzJ950DZItOjPmIDbnQtFuJYG9",
    "https://lh3.googleusercontent.com/d/1GIxpTkft66BDP5h5XXy_UPfTq95LfknD",
    "https://lh3.googleusercontent.com/d/1I_Okw4ld8-_yirr9_saiR1h1QiRe2c4t",
    "https://lh3.googleusercontent.com/d/1a70z5MV5EkmmL9dgNiE1EgkLvVqRqQ0i",
    "https://lh3.googleusercontent.com/d/1IXvRL4x1jZLq628mU-HQP0lzv32ZSlYn",
    "https://lh3.googleusercontent.com/d/1Oc4KPBVohIoLIJzWYbgGPcTVyH9nuPwP"
  ],
  "4": [
    "https://lh3.googleusercontent.com/d/18hRZZcB0mJgjnPhHUQOyDdCmKqGc0kRj",
    "https://lh3.googleusercontent.com/d/1pVJ6N-allCUzjzC_a0jDE_2Shr4alOMu",
    "https://lh3.googleusercontent.com/d/110tzco0qt9YG0sn7jXDVeZciporaqJhB",
    "https://lh3.googleusercontent.com/d/1UqwCOSHONRAftzareAGJ9B42CNGACGxW",
    "https://lh3.googleusercontent.com/d/1nssOpFyTPjICEaO0wmjhrQOd_sjNAkkA",
    "https://lh3.googleusercontent.com/d/1YPkbY2PQEzbM8nJg6kDBiWKb93rn4ikv"
  ],
  "5": [
    "https://lh3.googleusercontent.com/d/1L-ELAOf_I1aWWvw0eO5kSpG-YqZINYe8",
    "https://lh3.googleusercontent.com/d/1tR41njsRcDrVZXeI85AX3sv-f-W1eicK",
    "https://lh3.googleusercontent.com/d/1G5DPcXhDbNy3e8APOgRWSA2pDnlEB-Yn",
    "https://lh3.googleusercontent.com/d/1uNWYKAH_z_eUmqGBV4EBZs2QjyV-sTA9",
    "https://lh3.googleusercontent.com/d/1VLMQ1H1ZSVnJNYB5brmV1Mno9ZQK44k7",
    "https://lh3.googleusercontent.com/d/1Fh6ZdysykTvCcdmFCopV-azO26wpsxk5"
  ],
  "6": [
    "https://lh3.googleusercontent.com/d/1p9kgdwpr8y6BIe29LWD3ASIwpgPe7eYq",
    "https://lh3.googleusercontent.com/d/1muidScoxydA8sip9ZYImsr7zVCAtSGSo",
    "https://lh3.googleusercontent.com/d/1k2G1pMSqqqSz-KvcA3SNK6aa4F9Ou2OK",
    "https://lh3.googleusercontent.com/d/1Cj_q7c0zLsgbwX5yfvbQSFwCVdKlHie7",
    "https://lh3.googleusercontent.com/d/1nx653QBgP__-t4QsVwSFBYikg6OSbgzz",
    "https://lh3.googleusercontent.com/d/1kkrhbM9Qx2HqZJLnEiazh2mRN2lxNCER"
  ],
  "7": [
    "https://lh3.googleusercontent.com/d/1WokOmJYuzLI95QDkIlP5PcU-N38jECxG",
    "https://lh3.googleusercontent.com/d/1Lph0Zp56mcVoHRTtatrqSwPWoSOsvWqs",
    "https://lh3.googleusercontent.com/d/1UmOZjHq8v_tFmcIr-1OIs8OlOE9DCJvb",
    "https://lh3.googleusercontent.com/d/1nNXu8y0Ra2KkFgmR7l4xVxm4oIbQODBq",
    "https://lh3.googleusercontent.com/d/1sdZuQGHwUen8ftu0eg8v6F2IlYFpRZPe",
    "https://lh3.googleusercontent.com/d/1Kc08uvtnLDZsIc9zHNFENQPu8qHpOrxN"
  ],
  "8": [
    "https://lh3.googleusercontent.com/d/1vY5lxNJjl7CVst7ytdgqzePVD-VA2Mbz",
    "https://lh3.googleusercontent.com/d/1mMXhWxgVOLv617jbdTDxkCxrMOLOyC-5",
    "https://lh3.googleusercontent.com/d/1PImGDEkr-zpvNSciDOdQqMMEYZhY6Uk5",
    "https://lh3.googleusercontent.com/d/1VbxLc4R9ZoaR6RHP5SgOHYJKOO9LMcR1",
    "https://lh3.googleusercontent.com/d/1nte0nhhwyzpO87m2B_JsbhrnfHKMOYi2",
    "https://lh3.googleusercontent.com/d/1dOwSHCdgd32xbhVUL33cLap5vVgFTmnu"
  ]
};

export const getUnitSlideImages = (gradeId: string, unitNumber: number): string[] => {
  return unitSlideImages[gradeId]?.[unitNumber] || [];
};

export const hasUnitSlideImages = (gradeId: string, unitNumber: number): boolean => {
  return (unitSlideImages[gradeId]?.[unitNumber]?.length || 0) > 0;
};

export const getIsLessonSlideImages = (lessonNumber: number): string[] => {
  return isLessonSlideImages[lessonNumber] || [];
};
