// ระบบคลังสไลด์ภาพประกอบการสอน (ChatGPT DALL-E 3 ในสัดส่วน 16:9 จาก Google Drive)
// ความละเอียดสูง โหลดผ่าน Google Cloud CDN โดยตรง ไม่เปลืองพื้นที่จัดเก็บในโปรเจกต์เว็บ (Zero Disk Bloat)

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
