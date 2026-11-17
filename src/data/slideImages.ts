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
  "python-basic": {
    "1": [
      "https://lh3.googleusercontent.com/d/18RSotY88NkkQymgYMvUEbC_1dTbM3WBj",
      "https://lh3.googleusercontent.com/d/1dVUtmAnOEQNT4UOsyCjLAGAfcGCMvGHI",
      "https://lh3.googleusercontent.com/d/1DDME618sO5wBShAL4RaCVe1BUTSiHfzE",
      "https://lh3.googleusercontent.com/d/1vb0JdEr3pRNb3w91PFKXOupO9gEz5FUm"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1A7Y3JYOIsf_HDKiP5__hkzGQ4dezHTgJ",
      "https://lh3.googleusercontent.com/d/1RGpLsreF-I9QyM9K6D2y7T2G7F7VZUO1",
      "https://lh3.googleusercontent.com/d/1vd1kzqjatnDb6qKuuVBpSn6nS-JgiX-p",
      "https://lh3.googleusercontent.com/d/1WZwFz_0xXF5E49zTA_NYYDLhueGFWGY-"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1L5yGjMjO5QaxzlsOjuq6xoYGIgm3KqWM",
      "https://lh3.googleusercontent.com/d/17QoFvtX3NuxWm7Qrb_dyNvmQgPT7wSC9",
      "https://lh3.googleusercontent.com/d/1hbqPCbPtxmGhP45dGzS5Ki7yi2TPmUd3",
      "https://lh3.googleusercontent.com/d/1D8sF18IiMx5jyZrIzi0Ccfw8S7aFSssX"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1w2cvC6TcO2UEIfpMz6KYSKwKS258APDw",
      "https://lh3.googleusercontent.com/d/1TAjV5tf3IsTFbSlSahe4BeUzdOdgNzkF",
      "https://lh3.googleusercontent.com/d/1NFa4g9mOLFOWqkecBvc-TJKVBiNMuMlD",
      "https://lh3.googleusercontent.com/d/1gVIx6G4Wm7icPxN4EU6Pt2UEoiKTLRbR"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/15LqnJAlsMjcdAarXEezgjdetYsoJJGh4",
      "https://lh3.googleusercontent.com/d/1xG38iXNOtVgsq-W6HWl3tZ6_fWDFlpjT",
      "https://lh3.googleusercontent.com/d/1iVKzE36jSu8PeUGqwEodlG7Y60S91IrX",
      "https://lh3.googleusercontent.com/d/1bnQv_oIeoFJqQlFJieHG8Me1NANm5o1v"
    ],
    "6": [
      "https://lh3.googleusercontent.com/d/1OXJY-jylVZQ7QFC8vIP6oSMkVe0fx58a",
      "https://lh3.googleusercontent.com/d/1aAUQirxyiu3SgTwt7LQOHJfAYAObHfKD",
      "https://lh3.googleusercontent.com/d/1iet79XJ1AoeYRZctYCyi-6z1Kn-WS-eq",
      "https://lh3.googleusercontent.com/d/1MUKoqJ1IEQ56750Wvc9FZJqaBMP5dlsa"
    ],
    "7": [
      "https://lh3.googleusercontent.com/d/1LLSM0G-5iFkTUz_18wC5byGLwxFMQVvs",
      "https://lh3.googleusercontent.com/d/1lqvONO5BiLH4FPhzI6Ibj8mhLpnybRTg",
      "https://lh3.googleusercontent.com/d/1n417DQUtZEOZ-LAvb_b5W8jsnIQ8-chG",
      "https://lh3.googleusercontent.com/d/1mlicLJB7t8L_QyxgYwb6J2bGo0Zf0X1e"
    ],
    "8": [
      "https://lh3.googleusercontent.com/d/1ebRk86z-nrBugmy3tVrdFMTWyAng5bXm",
      "https://lh3.googleusercontent.com/d/1N3E8oaA292V38Gl4iuTygtUawXzQssEz",
      "https://lh3.googleusercontent.com/d/1mjJo3GUChub8-a6FmjPa-nvobZY2M5xp",
      "https://lh3.googleusercontent.com/d/1V2poXVP0TwYauqmQKOTTUB5bO4OSL23w"
    ]
  },
  "ai-p1-3": {
    "1": [
      "https://lh3.googleusercontent.com/d/1acZiyuM2MolJxpNsm0b_KfgZO2ltqwM1",
      "https://lh3.googleusercontent.com/d/15JyXt2Bmo-eGdJWzunNuclzg8cvZpjE8",
      "https://lh3.googleusercontent.com/d/1ldRT0oeWck4sajKqpFokXFBytuGPKGwA",
      "https://lh3.googleusercontent.com/d/1VKJFm6m8xSiS1D0B4ZOAS4g-c6in0H-M"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1nxidVvF7mbTiEAtW6uVixko_qM7brllV",
      "https://lh3.googleusercontent.com/d/1r3JzcocpnulKrfoUhCng-D8zAODm3X8s",
      "https://lh3.googleusercontent.com/d/1ju6CwPbLMCc1Y3uw--WWMa32MJllwCfN",
      "https://lh3.googleusercontent.com/d/1G6sMsi3WnxA0WvaJQ99xSzOkNMt10yZq"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1H8NNngSnQ0kEqiyVUXAypDYlPGduNgLb",
      "https://lh3.googleusercontent.com/d/1kgEG4PQonZRZYNx3Suoi-E__tl3yQkAc",
      "https://lh3.googleusercontent.com/d/1_rfHtcb5USfPDH4VFaWyErn329lUfYJU",
      "https://lh3.googleusercontent.com/d/1dyMEwVmL0Geh-FjeyYv8p1TKuYjm_BLM"
    ]
  },
  "ai-p4-6": {
    "1": [
      "https://lh3.googleusercontent.com/d/1Zv3jmy9aUpVsQ6iGd6z01hvaEf2ZNdnw",
      "https://lh3.googleusercontent.com/d/1coHKgTkj48IS13F3Itrqj2Kphzh2tg58",
      "https://lh3.googleusercontent.com/d/1VP5dsKnJKw7YlMlwfYuF5bi8vm2RsiXr",
      "https://lh3.googleusercontent.com/d/1g785w0gLz-4_0pb8WZtjKVCPpJFKg2Nt"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1Lvr3cxNh1rHB12NJH3sE_dQZqfUA9TfE",
      "https://lh3.googleusercontent.com/d/1yLRB39RYIIkT6GsI6sOZwfkvsKpgko41",
      "https://lh3.googleusercontent.com/d/1PKgjePsKi-PICTv6Pmn1YxnCOTHq1q7i",
      "https://lh3.googleusercontent.com/d/1C8-WXninrcQ-OaaBazFXP9U83DaoSLdD"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1MmVPUUywQXjKOcluOGfqJcHinFsTLYDt",
      "https://lh3.googleusercontent.com/d/1xNPnF3wlnNUE8dzopXA0Y1k6SQDQhFfh",
      "https://lh3.googleusercontent.com/d/1vIDIa98isARXQLrJKS0kCqUswJYBhm33",
      "https://lh3.googleusercontent.com/d/1HjVhbdBvh-sQR1GSnAA-3usSE9REBe7F"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1WpKIgxG3X5wQI9u7UzBHthe9UGTJk-PY",
      "https://lh3.googleusercontent.com/d/1n3EjXDlMtIPlXJ-OF5fBB7VHMkTsiCDv",
      "https://lh3.googleusercontent.com/d/1azMkiytmKPMZZtTpxEqGjCUjAJoK7JIv",
      "https://lh3.googleusercontent.com/d/1KRdju46Hm_eQ9scR0ZbbghDFsK3gxAKS"
    ]
  },
  "ai-m1-3": {
    "1": [
      "https://lh3.googleusercontent.com/d/1id80mLzXka8RiBXdAzuvBucCnlc3dxNV",
      "https://lh3.googleusercontent.com/d/1Sepj8M1YO7Kd4SgjJR5N-LNpgb--k1og",
      "https://lh3.googleusercontent.com/d/1g5mbZlN2Y37rfRoOEqPmZ_6TpZFFNq2u",
      "https://lh3.googleusercontent.com/d/1mZJSZezHJx2S4G4aJX42Rrb0E7Zdbm7B"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1i_mURg_VYrzzm0bWiNjBDPeWIZZDuqYg",
      "https://lh3.googleusercontent.com/d/17UlDjhiBBmLZiNuqvUgrl8c3bsgGLgNZ",
      "https://lh3.googleusercontent.com/d/1haMcqmGMVyZmuhrBovTTOE512-vvkn93",
      "https://lh3.googleusercontent.com/d/1l23tB0YZ-5jkmqYHHfe_WEE5DvLyRliX"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/13W41Zqo0M2E1jaysvw51lwBuL1W-9HIw",
      "https://lh3.googleusercontent.com/d/15FI-GEAywLui042oEl0_inUn3a0C-bug",
      "https://lh3.googleusercontent.com/d/1edsfA0z0wbxwgqnjxdGbEuwRfJQ7o-ns",
      "https://lh3.googleusercontent.com/d/1n14WiiaQCnDl40bJMjYb6qai0PIc67vz"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1YsVlZazJs8qEsZEDRQ1LEPD7UVWKt25F",
      "https://lh3.googleusercontent.com/d/1-y60fn5iOaEiQG2FteJ-hwEmAPhpkuI1",
      "https://lh3.googleusercontent.com/d/1Ks10UyohQTZ0xscx4bXRsi_uhlfnVLVA",
      "https://lh3.googleusercontent.com/d/1-iD8CRhZeN62RM96VOmjwBo6O2F0T2Bf"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1-9kDiJwh5IPGWA5B78EejXvUJSXDW48x",
      "https://lh3.googleusercontent.com/d/1GPFVz7l7tucWg5oFfqlAfVXc9FhAjZWA",
      "https://lh3.googleusercontent.com/d/1GqSczWrKsiYKIQjLWGEnAbj_S_jU72i0",
      "https://lh3.googleusercontent.com/d/1Io4KZFwCjW7lAbNea7cwLNgHnu6RFXhH"
    ]
  },
  "electronics-basic": {
    "1": [
      "https://lh3.googleusercontent.com/d/1eTZTCddHVUBlwHkpg962_A_cbYhcRvql",
      "https://lh3.googleusercontent.com/d/1YnFHpsx0-X6wXgXDYCNbboVbQPgIKZSD",
      "https://lh3.googleusercontent.com/d/1zRiKm2yM5nvvCyDnzK-0GOdtf0K1FzTv",
      "https://lh3.googleusercontent.com/d/1-5I5kgDMg5rx38qpL_dCE23EN6P1XoNJ"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1fUUP5Dxdp8_vdVm9p3syWxdp4kCamqbh",
      "https://lh3.googleusercontent.com/d/1qd-Ghm9V-Yl_ycdAh-SqouZu0iGhGIql",
      "https://lh3.googleusercontent.com/d/12uq8-Hdaszy4lnjQEkToJK3DTrPldyQC",
      "https://lh3.googleusercontent.com/d/1XUW4SbqiuR-i_nVoM6E_9VfplEnmxeRF"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/19Ucnw8jC_kQ4ZwGC33X5QjYMHqaBaeMR",
      "https://lh3.googleusercontent.com/d/1sqpa7D5HUSsQ_9ogeeaxkju27DZI6MMr",
      "https://lh3.googleusercontent.com/d/1WmNF9rqPlcEdp37FA5hcPscFah6afiVF",
      "https://lh3.googleusercontent.com/d/1AMFGEgNg327yGUBYntB47N5CvZC_bAyW"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1hkIVF2pxFzHVumKHJRHPKLm4kMmaiT_9",
      "https://lh3.googleusercontent.com/d/1kdR2ptaN_d-Zj2RqCWgMznLav7kbvNhY",
      "https://lh3.googleusercontent.com/d/19gMtXCjaV9kPPSHWGNlZTjeLds7_wXZ8",
      "https://lh3.googleusercontent.com/d/1ZFvIvoU0qKS2K7qBDpirC5jZNOxYOzlU"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1Ep193KrOG8on9GX6WNVDeSMc_Tjd4yqj",
      "https://lh3.googleusercontent.com/d/1PahyY5eigjEEi9sDvbM5WOcWQqv8869r",
      "https://lh3.googleusercontent.com/d/103pPMSalmbYev2I3cFVWKYkdjNJsilK5",
      "https://lh3.googleusercontent.com/d/1WCAv-ApFY75IBYPGLcQ0Qc3VIOkeHHgf"
    ],
    "6": [
      "https://lh3.googleusercontent.com/d/1zIXVC7vvKGlFdw1StC0RTKgTSmnSh1o7",
      "https://lh3.googleusercontent.com/d/1voTWO8hr5CojquJztOJebI-OTZh5gw33",
      "https://lh3.googleusercontent.com/d/1qPNo25xmOivdCnodRqWwg_PMeIfRNTpL",
      "https://lh3.googleusercontent.com/d/1X8cNvG88HJRTAyvpxFMuHWdTNTNZqVaW"
    ]
  },
  "arduino-basic": {
    "1": [
      "https://lh3.googleusercontent.com/d/1pNwhDSd1WjLRyNJTm07AF94Sx_o_kYmX",
      "https://lh3.googleusercontent.com/d/1LneWCDgW5AWr4bEYQId_PT4o5oW2mpNy",
      "https://lh3.googleusercontent.com/d/185rkEIJxNt9RtkuMEY_n4nRfaM0r8MM_",
      "https://lh3.googleusercontent.com/d/1tHGwLrpUzvha3_uOnFq1Yr0s1KEtbgjP"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1iQmWaWHhZpLV4UTUL3Q_yZO0hPepm2CB",
      "https://lh3.googleusercontent.com/d/1DLD5WF73MVAs-yDlFfY07Pl81toy6BgN",
      "https://lh3.googleusercontent.com/d/1ies-1lX58fc1XqEpiCB3Pc92DjuNesfA",
      "https://lh3.googleusercontent.com/d/1u_OYxoid5wB4RM0Bo6xVNa2YZvY8jJLo"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1-MBCxVW_rzHYQPlS20hJOJdXanx8yEwM",
      "https://lh3.googleusercontent.com/d/1_8LEcd-VX2EeOsVdEerQGE2gjxsDK6ow",
      "https://lh3.googleusercontent.com/d/1qk7n4sYUBsfxD6N38FIsqBta5ggvORVL",
      "https://lh3.googleusercontent.com/d/1UDEVlzzPkr2rTLTpSY2C_lQkr7NHEEfT"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1KV4jqWvy_z8I970du9KL1t9pY5RJn6iZ",
      "https://lh3.googleusercontent.com/d/1SkQxW2jwkseeL8UXijtO9i_u8MfoPCVP",
      "https://lh3.googleusercontent.com/d/1MZF0UezD39L1Rh_O5b4D2YIz0YawrLQ1",
      "https://lh3.googleusercontent.com/d/1y6YTo6SUF5Azs5Mp7LP3Yb4TQFfY_QLs"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1cd9JtlWeDZIUbqO0wLehRlhLv1i4RJiP",
      "https://lh3.googleusercontent.com/d/1-akdUJeWG0Rc_zcNbBf631etmapXEImu",
      "https://lh3.googleusercontent.com/d/10gql3RcHrXr-Sz2P6XZNx2UPzaQEM45I",
      "https://lh3.googleusercontent.com/d/1qOyC1F0CEzaLfbNOvvugQsti5GaYVQVD"
    ],
    "6": [
      "https://lh3.googleusercontent.com/d/1q_Kx1E-QmlXDsyZerlAzX2m5HxVvZjeU",
      "https://lh3.googleusercontent.com/d/1rrcZ5ba6MWk4lbwYssJ2YgwszIrl156v",
      "https://lh3.googleusercontent.com/d/1x0fPqeVUIxUDF-L59IX-ORCi5KuJTJ_R",
      "https://lh3.googleusercontent.com/d/1VV7Z9qcB_Y9-ZCdH3ifOHxeEuCwOciwI"
    ],
    "7": [
      "https://lh3.googleusercontent.com/d/1loQlNwyC6aSX--eFlgGVgonn5DR_yFqZ",
      "https://lh3.googleusercontent.com/d/1EhVVEB3Qgl2B45IXWwSQZl4xeDJKeW1e",
      "https://lh3.googleusercontent.com/d/1LB3ZD5wR2JTkmzvUxR_-oXlYLFK4qQJh",
      "https://lh3.googleusercontent.com/d/1401qD9VxmgwyevyotIlH1iNpELLuaMsi"
    ],
    "8": [
      "https://lh3.googleusercontent.com/d/1A-S1qgH66s83upmaIM8AC8KfeMAWoTrB",
      "https://lh3.googleusercontent.com/d/1M8WOcK_y6TzGqkG8Yv0YGQDJ3IpKVEoN",
      "https://lh3.googleusercontent.com/d/1qrVwXQHJ_Fxi1v98sP999Qkzx67ifWYp",
      "https://lh3.googleusercontent.com/d/1HNH8MSXSWYYdaonIpa35u3V1cEvqZ2HM"
    ]
  },
  "database-basic": {
    "1": [
      "https://lh3.googleusercontent.com/d/1dcUfLRgDSaYXo_RyeVN08k6DD_Gx2RFI",
      "https://lh3.googleusercontent.com/d/1dTFc6ozWvF9qZGhBt2E4tiQ9EkMiLwzG",
      "https://lh3.googleusercontent.com/d/1j1_Jw_lzosm02ZeRkZAnRkAnNcW_8kDi",
      "https://lh3.googleusercontent.com/d/1WbPneI8N7bYKvAwvNVd3eQWxZtcAbA7b",
      "https://lh3.googleusercontent.com/d/1ugaW1X29rgChqVWY2-tOSYQLwwk6R6CK",
      "https://lh3.googleusercontent.com/d/1WUL4jNRvgL7wTL6rhgAHyDHfjDRcBGxH",
      "https://lh3.googleusercontent.com/d/1Mdkb65Xr2UTor-MO7w1HM7ny41JXoxl9",
      "https://lh3.googleusercontent.com/d/1iQ5nITVNlfVeSv2jxUNVOGkX1OWWSQrN",
      "https://lh3.googleusercontent.com/d/1jKrw2jL2X1wTJhcDZlXAwNgZGE9p5wAC"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1Q0RkN7O_t795PX4B9_SJZbv0N1GvJflH",
      "https://lh3.googleusercontent.com/d/1M8hp0ShGXL_sXiYeIIfKh-o8ackAIrfw",
      "https://lh3.googleusercontent.com/d/1lF7IcDwrwXhncGIa1Ncx7ZrOWuHW8nrc",
      "https://lh3.googleusercontent.com/d/15iLmvT-9S-6KWgikakjjf5yhn8JOR-M9",
      "https://lh3.googleusercontent.com/d/10XPVPE8Ruox1z7w6TzUhJLjU4S-1UhWY",
      "https://lh3.googleusercontent.com/d/13ZiOw1JlcfwClGISASinT7VmQj8p18P1",
      "https://lh3.googleusercontent.com/d/1rhj49BZxTIK647luqHm5k0iUXuaS52ub",
      "https://lh3.googleusercontent.com/d/1Hl9leLNi4nDY00UtFAGjtYyB9srChPDA",
      "https://lh3.googleusercontent.com/d/1VYMtniH26nRO9la7S7F3s3xz_T1Wuwnp"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1fnQz-zkSHpuBBjbVk7JeUw78MNyuK58_",
      "https://lh3.googleusercontent.com/d/10vbja_7O-n4oD7bk_7-sAag5wwF1g7C4",
      "https://lh3.googleusercontent.com/d/1c7c4t7KmtWIK7u42pJm0F7lNhXw9x5t6",
      "https://lh3.googleusercontent.com/d/1XGgPZk6TzuRjqWxvT92o4JRFjpDc_kM_",
      "https://lh3.googleusercontent.com/d/1PLQHmzf1KhnW-tA9gp8KBAXp0WqCco5g",
      "https://lh3.googleusercontent.com/d/14Eohl6u5w_pdjpLTvEb6mcCEBkQxJLG4",
      "https://lh3.googleusercontent.com/d/14WJp7JGQuO4BwPLGC0WmKJzsj95qxaBI",
      "https://lh3.googleusercontent.com/d/1f0O0oDKpKY3DbjtAvh9aDUE3vB6KUwNw",
      "https://lh3.googleusercontent.com/d/1G-rZmftKsDeO-JwygyaSvi-p5Zazd8JQ"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1SQz3-p8jcQt01GUGtTTXH3LeJomzoDAb",
      "https://lh3.googleusercontent.com/d/1cQXlS4bRb7uIdTJ5RVSEvb9ITfiEEfuH",
      "https://lh3.googleusercontent.com/d/1XsHry__wO2nzDC8V8PeaP05edvpKk8Lc",
      "https://lh3.googleusercontent.com/d/1cs__CG16Nh4n_99tBWgr5V9aefCzTnBf",
      "https://lh3.googleusercontent.com/d/1S57czZPka9qw--7yujus2bXxKdAWfAVC",
      "https://lh3.googleusercontent.com/d/1lMJNjGDy8wxXI8zvRIcfSlx6b-QTUksb",
      "https://lh3.googleusercontent.com/d/1bNFZQ9kjXxDw1eCbusYc1YX7igUq-ONP",
      "https://lh3.googleusercontent.com/d/14judYxTXiSyUoigA-B2Mi231KtM2Xid3",
      "https://lh3.googleusercontent.com/d/1g5ZpULzHemCm7UA7IW3-54S5YCDPeGIT"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1h5rRDWtw_q57whbKePpBOCRDsfasBTyb",
      "https://lh3.googleusercontent.com/d/1bw8DS3QeLodaPaUej8NomVsCrHhP30C4",
      "https://lh3.googleusercontent.com/d/1-4I7kgkWjx9QNsn0_6GXCYSksOt__9Eu",
      "https://lh3.googleusercontent.com/d/19G0ojzF3-OVuJhepnKCUFpK9SEPIb0Om",
      "https://lh3.googleusercontent.com/d/1azqICj3ZlDSacHY8UoaVJqPZ6gEp6ouX",
      "https://lh3.googleusercontent.com/d/1uoQuAQ5tj02eSct9loMX2P3cqIUdsfy6",
      "https://lh3.googleusercontent.com/d/1GxF-MKsxyrM6T9fGbWwmuZ-H0tepI8RA",
      "https://lh3.googleusercontent.com/d/1dfBA3u1Bkr8SjqgFaUQBmZiZzLc9XjzD",
      "https://lh3.googleusercontent.com/d/1-l1lnICb_8nUZT1S5H5DK8Pp1f2iJ4ia"
    ]
  },
  "digital-story": {
    "1": [
      "https://lh3.googleusercontent.com/d/1wHk5qH3jxPzg_C0iwk_gg1gx02mnZnee",
      "https://lh3.googleusercontent.com/d/1VQQguYELNbcTQqvYMwk5jwhWnVnk_CXY",
      "https://lh3.googleusercontent.com/d/1DTgWHmwT1bKyTG7Vf22k6NiDOMEVhsZ0",
      "https://lh3.googleusercontent.com/d/1gO6xghpDzQchj_G5jexHmLzcyiuMf3Az",
      "https://lh3.googleusercontent.com/d/1tGlibuws2TwLLJ17Ap4Ifd_oryOh5Qec",
      "https://lh3.googleusercontent.com/d/1RCN7R4dArgZug4JKIKvBm3gtUqLOEKZE",
      "https://lh3.googleusercontent.com/d/1iXRsrYVnWKgjDWqM3oC4A-x4Ze2YefMQ",
      "https://lh3.googleusercontent.com/d/1NkepjVI8A61AVBofPN4yhq2MjJS9CAu-",
      "https://lh3.googleusercontent.com/d/14S9Izf2K1TjUOzIhLpX18gv05vEV_iPW"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/18hOM1YUYslf74tciSkbFgaouO7kKssAY",
      "https://lh3.googleusercontent.com/d/18jzU2uaSySeugp91ip_MXd7xxusnqwtH",
      "https://lh3.googleusercontent.com/d/1LXPlX9r1SnseMkzNnIx2SrB95MOf_wKB",
      "https://lh3.googleusercontent.com/d/19d6pOC2uGZ8ylUMt51pm46Z2pW9RiyRF",
      "https://lh3.googleusercontent.com/d/1n2Yv6LTarVtdFE5ompVQiOvKw5gr5ZUc",
      "https://lh3.googleusercontent.com/d/1UO9iRw2gmegcrqwQ2ij_URVJUolNvYFv",
      "https://lh3.googleusercontent.com/d/142m_Gexq9o-Sct7wVBpqUeGzOHJROW5P",
      "https://lh3.googleusercontent.com/d/13oK9FX9xPcz7MM4TstoswxVyrkPs82Y2",
      "https://lh3.googleusercontent.com/d/1JWI3ID56yGZTXPcTyWRiJePHeVOk_ubS"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1pFD2RIcPSy_zZp_5D7RCAGxZowelvzGJ",
      "https://lh3.googleusercontent.com/d/1yITco3JHSQBgIogmP7o82YaV2l6erbsk",
      "https://lh3.googleusercontent.com/d/1QjHd3LcnXZnXt6HgILgk0Xw6CBTjDmqa",
      "https://lh3.googleusercontent.com/d/1MxqxJ2iO3BQhY_IJBQTnjayrIJONA9qr",
      "https://lh3.googleusercontent.com/d/1vflJ3mi765l5ugeMNIRZh4QIAuR24M83",
      "https://lh3.googleusercontent.com/d/184FTViru3840Mnsljsk9VHJXc9_ALYua",
      "https://lh3.googleusercontent.com/d/17L7lJbQM2YfTZDHodlr0v_Wxwc4TH9fL",
      "https://lh3.googleusercontent.com/d/1jhpvApZyMZVn8S9ZIfLfj6iG7sk4cmo7",
      "https://lh3.googleusercontent.com/d/1vtV6KDTrUXmTdrHBD7XaReyxhQHG5lQE"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1zgV05xYuv1SKUIj9j4karNW3hGToCV6Y",
      "https://lh3.googleusercontent.com/d/1nHKFzOJ-oNbc2QFO2P2ITf_00PNJfTn0",
      "https://lh3.googleusercontent.com/d/1l5RedFtmOoTNuoxcSHRmn-l8bAk9bEkn",
      "https://lh3.googleusercontent.com/d/18f98_VxD3Xfhy0MViGDOYP1kAj2HEDxw",
      "https://lh3.googleusercontent.com/d/1abNjF3-XzN_HNmH_KCpxkXclg2iUBHGQ",
      "https://lh3.googleusercontent.com/d/12O4Z0erkpsJ-517rEzu8YuPbPZFkbAS_",
      "https://lh3.googleusercontent.com/d/1cI5jubDSKBDPSVQithum0O4sU7RS8_YB",
      "https://lh3.googleusercontent.com/d/1q510V_Wf_kcbktCK7aLopZt90pKqdDNx",
      "https://lh3.googleusercontent.com/d/1gGrd3BR3POENNODM4rNOsLuAXKNQbyHN"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1ZeqAdJoHu1XTSf8v-fHTJMii1cJ0O9yq",
      "https://lh3.googleusercontent.com/d/1uq58tP295EK1ZP3OLi8wRFCIsg8iOlTo",
      "https://lh3.googleusercontent.com/d/1dLThQXlfZeMuQYPeHkXVhi5KZWzYpqf8",
      "https://lh3.googleusercontent.com/d/1MtuUvPokw9FgQXFD5VjE7tzDXjVpcSWB",
      "https://lh3.googleusercontent.com/d/1w7aVfDKXKXA_vVPh0kXPGJMYosF8Z5PM",
      "https://lh3.googleusercontent.com/d/1sZyLgf2EBkTUVoDgM4Q4i1pKc7u6010t",
      "https://lh3.googleusercontent.com/d/1-CX2kv_79jmcSuR90tfV3DyiahVZ0mIW",
      "https://lh3.googleusercontent.com/d/1OXxeGyPxicyZ1HDipZURRtV1y-3QpDrz",
      "https://lh3.googleusercontent.com/d/14AnQPmWF4y9yLvHqO1ijPMxn7u69F3H1"
    ]
  },
  "iot-smart": {
    "1": [
      "https://lh3.googleusercontent.com/d/1Kav07IU9dC-_et1E2RrTGIHFuWSmyrPO",
      "https://lh3.googleusercontent.com/d/1pkFQXa23ly6BhHU9knhg2y-L66rARc02",
      "https://lh3.googleusercontent.com/d/1ZPhz8cGuEAfsxIIh3jCIpT_DzGCjqlt6",
      "https://lh3.googleusercontent.com/d/1d5UC75s92XF55TZLLnXp21MYH_mN7B_D",
      "https://lh3.googleusercontent.com/d/1JFRqksqpFNxKTt2CHxfepTTdcM_5f54n",
      "https://lh3.googleusercontent.com/d/1L5RkJVLPaeYZH3Kyf-kC76mxmr_TRJZf",
      "https://lh3.googleusercontent.com/d/1ViCZ65Y__OY2vQlz-v_mf0zsulyBH1VQ",
      "https://lh3.googleusercontent.com/d/1hNPPH5YK3zgWmzTr0vNCbH6IJQnheokF",
      "https://lh3.googleusercontent.com/d/1LAn4a2J6_aS6AJZ8Grv5CZrxggFxGD0i"
    ],
    "2": [
      "https://lh3.googleusercontent.com/d/1WiGT25jWJ32h0TYE-ql-DG6ISgwHMhTB",
      "https://lh3.googleusercontent.com/d/1AIjAssOsT-BnlUvHQooEsYQq-DtayFWu",
      "https://lh3.googleusercontent.com/d/1QLqyzhSkwrcsPc6oOIsKyLOrRqhAyl9V",
      "https://lh3.googleusercontent.com/d/1RI5jTqVb11rptOq1M-vr0Def0aAd0F8E",
      "https://lh3.googleusercontent.com/d/1uMBENjFn-ApqUtiEP2uwNRS1_H31XKkz",
      "https://lh3.googleusercontent.com/d/1Zf4XKpbkhXMZaG_ZoZ0Rf-VfyKFvxZm0",
      "https://lh3.googleusercontent.com/d/1uG9UwlY0fOD8b5bVmDupbzXO-ZYz3K5C",
      "https://lh3.googleusercontent.com/d/1G5Q1ZwUWsgXF73Y79zXKhr0Icchr3nmD",
      "https://lh3.googleusercontent.com/d/1ibux3cquUnzcPkK28Nt8pjbOqHJjcU_S"
    ],
    "4": [
      "https://lh3.googleusercontent.com/d/1gW07ZBBSs96Rda6aCFLjqXpAy05xv17N",
      "https://lh3.googleusercontent.com/d/11NlqKLEXjtA5-4ZpuuarmRtSGqjbr9rl",
      "https://lh3.googleusercontent.com/d/1mwbc9ntTxVtaHvVz5IfLI10EPd3oHrtC",
      "https://lh3.googleusercontent.com/d/19tX9pki8M9II5rAPb89HPVWYnze6uvd5",
      "https://lh3.googleusercontent.com/d/1bn_cXf1UfY5X8Tgd01V4rGSj1J1Q-qEE",
      "https://lh3.googleusercontent.com/d/181SirY1FAcwYp2RQaklU-52IKboCM7rx",
      "https://lh3.googleusercontent.com/d/1jfBFgK6LMUK8l6Xmxnk2ILnvO64HoyS9",
      "https://lh3.googleusercontent.com/d/1hs8GiQ8sLxXoDWq37vS5R5q6ICYh9sHL",
      "https://lh3.googleusercontent.com/d/17HS9Vx--_NAdSPyO81sldNM4TDHLHAgX"
    ],
    "3": [
      "https://lh3.googleusercontent.com/d/1tKlpMRKDvUxRCsLwBhs20EVFfXtm9fyq",
      "https://lh3.googleusercontent.com/d/1MvomP3Xnpnr9RigzHxhjU9qpdXEHn-p_",
      "https://lh3.googleusercontent.com/d/1spL607UJgOtgUI4n4H3QtbOywFXF0e3D",
      "https://lh3.googleusercontent.com/d/1N9DB3n07lUjMYXf4O6YsCR7sydcOK-vA",
      "https://lh3.googleusercontent.com/d/19ESH8h_-H8-q9XDalyQ1H2zA9acKMQU5",
      "https://lh3.googleusercontent.com/d/1jFJq0g8YZRrA72pQwM94o8hr6aEBwnkf",
      "https://lh3.googleusercontent.com/d/1qPuEfOx70v2LmkS0zBPO1-iwbjI1qc0i",
      "https://lh3.googleusercontent.com/d/1gDR_VsxH146buC-tX9g_qdj6UM3DP0J9",
      "https://lh3.googleusercontent.com/d/1rtsLkFH-N7h1oISOIwO2yiVfrkcL3THc"
    ],
    "5": [
      "https://lh3.googleusercontent.com/d/1uwEMYFn5TQN2TwarcaaybebI3l6mG1oK",
      "https://lh3.googleusercontent.com/d/1YTE06NQZLHmHbsBmjrzPKHmW5nXDkuQl",
      "https://lh3.googleusercontent.com/d/1YI-oHpdrTC7h262TDW4kodiG4sDKHfHX",
      "https://lh3.googleusercontent.com/d/1szleC2cUvjPD_GeWJndIMNi3lvLrczAR",
      "https://lh3.googleusercontent.com/d/1YmITsdPEPXFJGz2inuD-AWKEulRGHejH",
      "https://lh3.googleusercontent.com/d/1v0QYmVuZWEluqFcj1aCIbAaIrEsCDYaS",
      "https://lh3.googleusercontent.com/d/1phY28iosO2rKwMnIe_1YeUEqs9ZAJhCw",
      "https://lh3.googleusercontent.com/d/1ae8mMgSpdXeRvZrPr1CiYnXhnj6xXtFg",
      "https://lh3.googleusercontent.com/d/1CCDLb5A5G3sAJDPkp8vs3L9fA9BX6Awa"
    ],
    "6": [
      "https://lh3.googleusercontent.com/d/1DAuAWbqo1xBtPZJyJ0Wkt3jAt_xW44Gb",
      "https://lh3.googleusercontent.com/d/1So-US3CREIfdCtNzDQEx5vQH7KzYzE08",
      "https://lh3.googleusercontent.com/d/17Mo5YBkAwNhI49kTgjiki0M-WLiw0TN4",
      "https://lh3.googleusercontent.com/d/1fckWaq4nN04FVRC9WeDs8SwkJ9-NkDsZ",
      "https://lh3.googleusercontent.com/d/11N2Yip0ABlB8ovdc-ygReiNkF8FnTbdh",
      "https://lh3.googleusercontent.com/d/1iusjlik-AZIofOw0_DjhixzIcML4PFIe",
      "https://lh3.googleusercontent.com/d/1yUv-ZdEkkmePRGx8uUMd4XAamLWEapAU",
      "https://lh3.googleusercontent.com/d/1DoWAasgR-JbIsNLjox3kTInAsmI-EsPt",
      "https://lh3.googleusercontent.com/d/1GNREcnm0lzf7J3seB4UhWTjGb6GpGoRS"
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
