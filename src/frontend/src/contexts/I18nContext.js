import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

const I18nContext = createContext({ t: (k)=>k, lang: 'zh-CN', setLang: ()=>{} });
const I18N_LANG_KEY = 'app.lang';

const dictionaries = {
  'zh-CN': {
    appName: 'RoomX',
    common: {
      default: '默认',
      system: '系统',
      browser: '浏览器设置',
      refresh: '刷新',
      cancel: '取消',
      confirm: '确认',
      ok: '确定',
      create: '创建',
      apply: '新建申请',
      save: '保存',
      submit: '提交',
      clearFilters: '清空筛选',
      loading: '加载中…',
      empty: '暂无数据',
      reason: '原因'
    },
    modal: {
      confirm: {
        title: '确认操作',
        content: '您确定要执行此操作吗？',
        okText: '确定',
        cancelText: '取消'
      },
      delete: {
        title: '确认删除',
        content: '删除后不可恢复，您确定要删除吗？',
        okText: '确定删除',
        cancelText: '取消'
      },
      warning: {
        title: '警告',
        okText: '我知道了',
        cancelText: '取消'
      },
      error: {
        title: '错误',
        okText: '确定'
      },
      info: {
        title: '提示',
        okText: '确定'
      }
    },
    lazy: {
      timeoutTitle: '加载超时',
      timeoutSubTitle: '组件加载超时，请重试或刷新页面',
      retry: '重试',
      refreshPage: '刷新页面'
    },
    layout: {
      pleaseLogin: '请先登录',
      notifications: '通知',
      themeLight: '浅色',
      themeDark: '深色',
      switchToLight: '切换到浅色模式',
      switchToDark: '切换到深色模式',
      defaultUser: '用户',
      csrf: {
        enabled: 'CSRF 已启用且令牌存在 (XSRF-TOKEN)',
        noToken: 'CSRF 已启用但当前未检测到令牌，后续写操作前会自动补取',
        disabled: 'CSRF 已关闭'
      },
      menu: {
        navigation: '导航菜单',
        dashboard: '仪表板',
        rooms: '教室管理',
        applications: '申请管理',
        myApplications: '我的申请',
        dutySchedule: '值班表',
        users: '用户管理',
        profile: '个人资料'
      },
      userMenu: {
        profile: '个人信息',
        settings: '设置',
        logout: '退出登录'
      }
    },
    applicationStatus: {
      title: '申请状态监控',
      subtitle: '监控申请状态，自动处理过期申请',
      expiringTitle: '即将过期的申请（15分钟内）',
      columns: {
        id: '申请ID'
      },
      actions: {
        updateStatus: '更新状态',
        updateAll: '批量更新状态'
      },
      messages: {
        updateAllSuccess: '所有申请状态更新成功',
        updateAllFail: '更新申请状态失败',
        updateOneSuccess: '申请状态更新成功',
        updateOneFail: '申请状态更新失败'
      },
      errors: {
        fetchStatsFail: '获取申请状态统计失败',
        fetchExpiringFail: '获取即将过期的申请失败'
      },
      rulesTitle: '自动更新规则',
      rules: {
        expirationTitle: '申请过期规则：',
        expiration: {
          items: {
            item1: '超过预约开始时间15分钟：申请自动过期',
            item2: '申请结束后24小时：申请标记为过期'
          }
        },
        frequencyTitle: '状态更新频率：',
        frequency: {
          items: {
            item1: '申请状态：每5分钟自动检查一次',
            item2: '教室状态：每1分钟自动检查一次'
          }
        },
        manualTitle: '手动操作：',
        manual: {
          items: {
            item1: '点击"批量更新状态"可立即更新所有申请状态',
            item2: '点击单个申请的"更新状态"可更新该申请状态'
          }
        }
      }
    },
    dashboard: {
      loadingStats: '正在加载统计数据...',
      overviewTitle: '概览',
      stats: {
        totalRooms: '总教室数',
        availableRooms: '可用教室',
        myPending: '申请中',
        allPending: '待处理申请',
        onlineUsers: '在线用户',
        pendingMaintenanceRooms: '待维修教室',
        maintenanceRooms: '维修中教室',
        todayMaintenanceReports: '今日报修数',
        pendingCleaningRooms: '待清洁教室',
        cleaningRooms: '清洁中教室',
        todayCleaningReports: '今日报清洁数'
      },
      quickActionsTitle: '快速操作',
      quickActions: {
        goToSettings: '前往设置'
      },
      buttons: {
        applyRoom: '申请教室',
        myApplications: '我的申请',
        allApplications: '全部申请',
        userManagement: '用户管理',
        roomManagement: '教室管理'
      },
      latestNewsTitle: '最新动态',
      latestNewsEmpty: '暂无最新动态',
      fetchError: '获取统计数据失败，请检查网络连接',
      todayDuty: {
        title: '今日值班'
      }
    },
    roomList: {
      title: '教室列表',
      searchPlaceholder: '搜索教室名称',
      addRoom: '添加教室',
      clearFilters: '清空筛选',
      allTypes: '全部类型',
      allStatuses: '全部状态',
      paginationTotal: '第 {from}-{to} 条/共 {total} 条',
      columns: {
        name: '教室名称',
        type: '类型',
        capacity: '容量',
        status: '状态',
        location: '位置',
        actions: '操作'
      },
      tooltips: {
        viewDetail: '查看详情',
        editRoom: '编辑教室',
        applyRoom: '申请教室',
        deleteRoom: '删除教室',
        deleteRoomDisabled: '教室正在使用中，无法删除'
      },
      form: {
        name: '教室名称',
        enterName: '请输入教室名称',
        type: '教室类型',
        selectType: '请选择教室类型',
        capacity: '容量',
        enterCapacity: '请输入容量',
        location: '位置',
        enterLocation: '请输入位置',
        description: '描述',
        enterDescription: '请输入教室描述',
        status: '教室状态',
        selectStatus: '请选择教室状态',
        timeRange: '使用时间',
        selectTimeRange: '请选择使用时间',
        timeRangePlaceholder: {
          0: '开始时间',
          1: '结束时间'
        },
        reason: '使用原因',
        enterReason: '请详细描述使用原因',
        crowd: '使用人数',
        enterCrowd: '请输入使用人数',
        contact: '联系方式',
        enterContact: '请输入联系方式',
        remark: '备注',
        enterRemark: '请输入备注信息'
      },
      drawer: {
        add: '新增教室',
        edit: '编辑教室',
        detail: '教室详情',
        apply: '申请教室'
      },
      detail: {
        futureApprovedTitle: '未来已批准预约',
        noneFuture: '暂无未来预约'
      },
      messages: {
        addSuccess: '教室创建成功',
        addFail: '创建教室失败',
        editSuccess: '教室更新成功',
        editFail: '更新教室失败',
        deleteSuccess: '教室删除成功',
        deleteFail: '删除教室失败',
        applySuccess: '申请提交成功，正在跳转到申请列表...',
        applySuccessBrief: '申请提交成功',
        applyFail: '申请提交失败',
  operationFailed: '操作失败，请重试'
      },
      errors: {
        delete: {
          relatedApplications: '删除失败：该教室存在相关申请记录，请先处理相关申请后再删除。',
          inUse: '删除失败：教室正在使用中，无法删除。',
          notExists: '删除失败：教室不存在或已被删除。',
          unknownPrefix: '删除教室失败: '
        },
  fetchRoomDetailFail: '获取教室详情失败',
        fetchListFail: '获取教室列表失败，请检查网络连接',
        dataFetchTitle: '数据获取失败'
      },
      labels: {
        people: '人',
        name: '名称',
        type: '类型',
        capacity: '容量',
        location: '位置',
        status: '状态',
        description: '描述',
        none: '无',
        roomLocation: '教室位置',
        roomCapacity: '教室容量',
        currentStatus: '当前状态'
      },
      options: {
        types: {
          caseroom: '案例教室',
          seminar: '研讨间',
          lab: '实验室',
          lecture: '平面教室',
          other: '其他'
        },
        statuses: {
          available: '空闲',
          reserved: '已预约',
          using: '使用中',
          maintenance: '维修中',
          cleaning: '清洁中',
          pending_cleaning: '待清洁',
          pending_maintenance: '待维修',
          unavailable: '不可用'
        }
      },
      modals: {
        confirmDeleteTitle: '确认删除教室',
        confirmDeleteQuestion: '确定删除以下教室？',
        warnIrreversible: '⚠️ 警告：此操作不可恢复，删除教室将同时删除所有相关的申请记录。',
        confirmDeleteOk: '确认删除',
        cancel: '取消',
        confirmUpdateTitle: '确认更新教室信息',
        confirmUpdateTip: '确定要更新教室信息吗？更新后可能导致一些业务无法正常进行，请谨慎操作',
        changesTitle: '变更详情：',
        confirmUpdateOk: '确定更新'
      },
  deleteInUseWarning: '教室正在使用中或已预约，无法删除。请等待教室空闲后再删除。',
  timeConflict: '所选时间段与已有预约冲突，请选择其他时间'
    },
    room: {
      status: {
        AVAILABLE: '空闲',
        RESERVED: '已预约',
        USING: '使用中',
        MAINTENANCE: '维修中',
        CLEANING: '清洁中',
        PENDING_CLEANING: '待清洁',
        PENDING_MAINTENANCE: '待维修',
        UNAVAILABLE: '不可用'
      },
      type: {
        CASE_ROOM: '案例教室',
        SEMINAR_ROOM: '研讨间',
        LAB_ROOM: '实验室',
        LECTURE_ROOM: '平面教室',
        OTHER_ROOM: '其他',
        UNKNOWN: '未知类型'
      }
    },
    user: {
      role: {
        ADMIN: '管理员',
        APPROVER: '审批人',
        APPLIER: '申请人',
        SERVICE: '服务人员',
        MAINTAINER: '维护人员',
        USER: '用户',
        DEFAULT: '普通用户'
      },
      permission: {
        READ_ONLY: '只读',
        RESTRICTED: '受限',
        NORMAL: '正常',
        EXTENDED: '扩展',
        UNSET: '未设置'
      },
      common: {
        notSet: '未设置',
        passwordMin8: '至少 8 个字符',
        passwordRule: '除长度外至少满足任意2类: 大写/小写/数字/特殊',
        enterValidEmail: '请输入有效的邮箱地址'
      }
    },
    passwordStrength: {
      title: '密码强度',
      length: '长度≥8',
      uppercase: '大写',
      lowercase: '小写',
      number: '数字',
      special: '特殊',
      weak: '弱',
      medium: '中',
      strong: '强',
      satisfied: '已满足',
      missing: '缺少',
      none: '无',
      sufficient: '已达到基础安全要求',
      requirements: '需长度≥8且再满足任意2类'
    },
    userList: {
      title: '用户管理',
      createUser: '创建用户',
      noDeletePermission: '无删除权限',
      allRoles: '全部角色',
      paginationTotal: '第 {from}-{to} 条/共 {total} 条',
      filters: {
        searchUsername: '搜索用户名',
        searchNickname: '搜索昵称'
      },
      columns: {
        username: '用户名',
        nickname: '昵称',
        role: '角色',
        email: '邮箱',
        phone: '电话',
        createTime: '注册时间',
        lastLoginTime: '最后登录',
        actions: '操作'
      },
      tooltips: {
        viewDetail: '查看详情',
        editUser: '编辑用户',
        deleteUser: '删除用户'
      },
      drawer: {
        detail: '用户详情',
        edit: '编辑用户',
        create: '创建用户'
      },
      labels: {
        displayName: '显示名称',
        username: '用户名',
        nickname: '昵称',
        role: '角色',
        email: '邮箱',
        phone: '电话',
        createTime: '注册时间',
        lastLoginTime: '最后登录',
        department: '部门',
        serviceArea: '负责区域',
        permission: '审批权限',
        skill: '维修范围'
      },
      adminVerify: {
        title: '管理员验证',
        content: '删除用户需要管理员权限验证，请输入您的管理员密码：',
        placeholder: '请输入管理员密码',
        okText: '确认',
        required: '管理员密码不能为空'
      },
      form: {
        username: '用户名',
        enterUsername: '请输入用户名',
        password: '密码',
        enterPassword: '请输入密码',
        role: '角色',
        selectRole: '请选择角色',
        nickname: '昵称',
        enterNickname: '请输入昵称',
        email: '邮箱',
        enterEmail: '请输入邮箱',
        phone: '电话',
        enterPhone: '请输入电话',
        department: '部门',
        enterDepartment: '请输入部门',
        permission: '审批权限',
        selectPermission: '请选择审批权限',
        serviceArea: '负责区域',
        enterServiceArea: '请输入负责区域',
        skill: '维修范围',
        enterSkill: '请输入维修范围'
      },
      messages: {
        deleteSuccess: '用户删除成功',
        deleteFailPrefix: '删除用户失败: ',
        selfDeleteLogout: '您已删除自己的账户，即将退出登录',
        createSuccess: '用户创建成功',
        createFail: '用户创建失败',
        updateSuccess: '用户信息更新成功',
        updateFail: '用户信息更新失败'
      },
      errors: {
        dataFetchTitle: '数据获取失败'
      },
      auth: {
        tokenExpired: 'Token已过期，请重新登录',
        forbidden: '权限不足，需要管理员权限',
        result403Subtitle: '抱歉，您没有权限访问此页面。',
        result403RolePrefix: '当前用户角色: ',
        result403NeedRole: '需要用户查看权限才能访问用户管理功能。',
        resultErrorTitle: '访问失败'
      },
      confirmDelete: {
        title: '确认删除',
        content: '确定要删除用户 "{username}" 吗？这是一个无法恢复，极其危险的操作！被删除用户将会立即登出。',
        nextStep: '下一步'
      },
      confirmDeleteSelf: {
        title: '警告：删除自己的账户',
        warning: '您正在尝试删除自己的管理员账户！',
        consequence: '删除后您将立即退出系统，无法撤销此操作。',
        confirm: '确定要继续吗？',
        continueText: '继续删除'
      },
      secondConfirm: {
        passwordTitle: '输入密码确认',
        usernameTitle: '输入用户名确认',
        passwordPrompt: '为了确认删除自己的账户，请输入您的密码：',
        usernamePrompt: '为了确认删除用户 "{username}"，请输入该用户的用户名：',
        enterPassword: '请输入密码',
        enterUsername: '请输入用户名',
        confirmDelete: '确认删除',
        passwordRequired: '请输入密码',
        passwordIncorrect: '密码不正确',
        usernameIncorrect: '用户名不正确'
      }
    },
    userProfile: {
      loading: '加载中...',
      userNotFound: '用户信息不存在',
      cards: {
        basic: {
          title: '基本信息',
          id: 'ID',
          username: '用户名',
          role: '角色'
        },
        profile: {
          title: '个人信息',
          edit: '编辑',
          save: '保存',
          cancel: '取消',
          changePassword: '修改密码',
          labels: {
            nickname: '昵称',
            email: '邮箱',
            phone: '电话'
          }
        },
        activities: {
          title: '最近活动',
          refresh: '刷新',
          empty: '暂无最近活动'
        }
      },
      form: {
        nickname: '昵称',
        enterNickname: '请输入昵称',
        email: '邮箱',
        enterEmail: '请输入邮箱',
        phone: '电话',
        enterPhone: '请输入电话',
        department: '部门',
        enterDepartment: '请输入部门',
        permission: '审批权限',
        selectPermission: '请选择审批权限',
        serviceArea: '负责区域',
        enterServiceArea: '请输入负责区域',
        skill: '维修范围',
        enterSkill: '请输入维修范围'
      },
      roleInfo: {
        department: '部门',
        permission: '审批权限',
        serviceArea: '负责区域',
        skill: '维修范围'
      },
      messages: {
        updateSuccess: '用户信息更新成功',
        updateFail: '更新用户信息失败',
        passwordChangeSuccess: '密码修改成功',
        passwordChangeFail: '修改密码失败'
      },
      passwordModal: {
        title: '修改密码',
        okText: '确认修改',
        cancelText: '取消',
        fields: {
          oldPassword: '当前密码',
          enterOldPassword: '请输入当前密码',
          newPassword: '新密码',
          enterNewPassword: '请输入新密码',
          confirmPassword: '确认新密码',
          enterConfirmPassword: '请确认新密码',
          notMatch: '两次输入的密码不一致'
        }
      }
    },
    myApplications: {
      title: '我的申请',
      filters: {
        all: '全部',
        pending: '待审批',
        approved: '已通过',
        rejected: '已拒绝',
        cancelled: '已取消'
      },
      actions: {
        cancel: '取消申请',
        checkin: '签到',
        details: '查看详情',
        edit: '编辑',
        checkinConfirmTitle: '确认签到',
        checkinConfirmContent: '确认对该申请进行签到吗？签到后将无法撤销。',
        checkinConfirmOk: '确认签到',
        checkinSuccess: '签到成功',
        checkinFail: '签到失败',
        cancelConfirmTitle: '确认取消申请',
        cancelConfirmContent: '确认要取消该申请吗？取消后将无法恢复。',
        cancelConfirmContentApproved: '该申请已批准，取消后将释放教室预约。确认要取消吗？',
        cancelConfirmContentPendingCheckin: '该申请正在等待签到，取消后将释放教室预约。确认要取消吗？',
        cancelConfirmContentInUse: '该申请正在使用中，取消后将标记为完成使用。确认要取消吗？',
        cancelConfirmOk: '确认取消',
        cancelSuccess: '申请已取消',
        cancelFail: '取消申请失败'
      },
      columns: {
        roomName: '教室名称',
        usageTime: '使用时间',
        status: '状态',
        submitTime: '申请时间',
        reason: '申请理由',
        actions: '操作'
      },
      status: {
        pending: '待审批',
        approved: '已通过',
        rejected: '已拒绝',
        cancelled: '已取消',
        checkedIn: '已签到'
      }
    },
    applicationManagement: {
      title: '申请管理',
      badgeRetention: '申请记录过期后最多保留60天',
      filters: {
        roomSearchPlaceholder: '搜索教室名称',
        applicantSearchPlaceholder: '搜索申请人',
        statusPlaceholder: '全部状态',
        datePlaceholder: '选择日期',
        showExpired: '显示过期申请',
        clearFilters: '清空筛选'
      },
      statusOptions: {
        PENDING: '待审批',
        APPROVED: '已批准',
        REJECTED: '已驳回',
        CANCELLED: '已取消',
        COMPLETED: '已完成',
        EXPIRED: '已过期',
        PENDING_CHECKIN: '待签到',
        IN_USE: '使用中'
      },
      error: {
        fetchListFail: '获取申请列表失败，请检查网络连接',
        dataFetchTitle: '数据获取失败'
      },
      auth: {
        tokenExpired: 'Token已过期，请重新登录',
        forbidden: '权限不足，需要管理员或审批人权限',
        result403Subtitle: '抱歉，您没有权限访问此页面。',
        result403RolePrefix: '当前用户角色: ',
        result403NeedRole: '需要管理员或审批人权限才能访问申请管理功能。',
        resultErrorTitle: '访问失败'
      },
      actions: {
        back: '返回上一页',
        login: '重新登录',
        checkin: '签到',
        checkinSuccess: '签到成功',
        checkinFail: '签到失败',
        checkinConfirmTitle: '确认签到',
        checkinConfirmContent: '确认对该申请进行签到吗？签到后将无法撤销。',
        checkinConfirmOk: '确认签到',
        checkinConfirmCancel: '取消'
      },
      messages: {
        cancelConfirmContent: '确认要取消该申请吗？取消后将无法恢复。',
        cancelConfirmContentApproved: '该申请已批准，取消后将释放教室预约。确认要取消吗？',
        cancelConfirmContentPendingCheckin: '该申请正在等待签到，取消后将释放教室预约。确认要取消吗？',
        cancelConfirmContentInUse: '该申请正在使用中，取消后将标记为完成使用。确认要取消吗？',
        cancelConfirmTitle: '确认撤销申请',
        cancelConfirmOk: '确认撤销',
        cancelConfirmCancel: '取消',
        approveApproved: '申请已批准',
        approveRejected: '申请已驳回',
        approveFail: '审批操作失败',
        approveSuccess: '审批操作成功',
        cancelSuccess: '申请已撤销',
        cancelFail: '撤销操作失败'
      },
      columns: {
        roomName: '教室名称',
        applicant: '申请人',
        status: '状态',
        usageTime: '使用时间',
        reason: '使用原因',
        createTime: '申请时间',
        actions: '操作'
      },
      tooltips: {
        viewDetail: '查看详情',
        approve: '审批申请',
        cancel: '撤销申请'
      },
      drawer: {
        detail: '申请详情',
        approve: '审批申请',
        cancel: '撤销申请'
      },
      descriptions: {
        applicant: '申请人',
        roomName: '教室名称',
        startTime: '开始时间',
        endTime: '结束时间',
        status: '状态',
        createTime: '申请时间',
        reason: '备注',
        time: '时间'
      },
      form: {
        approveResult: '审批结果',
        pleaseSelectApproveResult: '请选择审批结果',
        approveOptionApprove: '批准',
        approveOptionReject: '拒绝',
        approveOpinion: '审批意见',
        cancelReason: '撤销原因',
        enterApproveOpinion: '请输入审批意见',
        enterCancelReason: '请输入撤销原因',
        selectTime: '请选择使用时间',
        selectRoom: '请选择教室',
        timeRangePlaceholder: {
          0: '开始时间',
          1: '结束时间'
        }
      },
      paginationTotal: '第 {from}-{to} 条/共 {total} 条'
    },
    dutySchedule: {
      title: '值班表',
      messages: {
        fetchFail: '获取值班安排失败',
        createSuccess: '创建成功',
        updateSuccess: '更新成功',
        deleteSuccess: '删除成功',
        deleteFail: '删除失败',
        submitFail: '提交失败'
      },
      columns: {
        dutyDate: '值班日期',
        dutyUser: '值班人员',
        remark: '备注',
        createdBy: '创建人',
        createTime: '创建时间',
        actions: '操作'
      },
      tooltips: {
        edit: '编辑',
        delete: '删除'
      },
      buttons: {
        create: '新建值班安排'
      },
      confirmDelete: {
        title: '确认删除',
        content: '确定要删除这个值班安排吗？此操作不可恢复。'
      },
      drawer: {
        create: '新建值班安排',
        edit: '编辑值班安排'
      },
      monthPicker: {
        placeholder: '选择月份'
      },
      form: {
        dutyDate: '值班日期',
        selectDate: '请选择值班日期',
        dutyUser: '值班人员',
        selectUser: '请选择值班人员',
        remark: '备注',
        enterRemark: '请输入备注信息'
      },
      todayDuty: {
        title: '今日值班',
        noDuty: '今日无人值班'
      },
      calendar: {
        adminHint: '点击日历格子可添加或编辑值班安排',
        userHint: '查看值班安排'
      },
      paginationTotal: '显示第 {from}-{to} 条，共 {total} 条'
    },
    feedback: {
      buttonText: '意见反馈',
      buttonHint: '如有问题或建议，请点击反馈',
      todayDutyTitle: '可直接联系今日值班',
      noDutyToday: '暂无人值班，您可以先写反馈，我们稍后会及时传达。',
      modalTitle: '意见反馈',
      submitSuccess: '反馈提交成功，感谢您的建议！',
      submitFail: '提交失败，请稍后重试',
      submit: '提交反馈',
      form: {
        type: '反馈类型',
        selectType: '请选择反馈类型',
        title: '反馈标题',
        enterTitle: '请输入反馈标题',
        titleTooLong: '标题不能超过50个字符',
        content: '反馈内容',
        enterContent: '请详细描述您的问题或建议...',
        contentTooShort: '反馈内容至少10个字符',
        contentTooLong: '反馈内容不能超过500个字符',
        contact: '联系方式（选填）',
        enterContact: '请输入邮箱或手机号'
      },
      types: {
        bug: '问题反馈',
        suggestion: '功能建议',
        complaint: '服务投诉',
        other: '其他'
      }
    },
    notification: {
      title: '通知中心',
      refresh: '刷新',
      markAllRead: '全部已读',
      loading: '加载中…',
      empty: '暂无通知',
      localTag: '本地',
      type: { system: '系统', application: '申请', room: '教室', user: '用户', security: '安全', default: '通知' },
      priority: { urgent: '紧急', high: '重要', normal: '正常', low: '普通' },
      actions: { markRead: '标记为已读', delete: '删除通知' },
      confirmDelete: { title: '确定要删除这条通知吗？', ok: '确定', cancel: '取消' },
      footer: { totalPrefix: '共', totalSuffix: '条通知', unreadSuffix: '条未读' },
      application: {
        approved: {
          title: '申请已批准',
          message: '您的申请「{{title}}」已获得批准。{{reason}}'
        },
        rejected: {
          title: '申请已拒绝', 
          message: '您的申请「{{title}}」被拒绝。{{reason}}'
        }
      },
      room: {
        statusChange: {
          title: '房间状态变更',
          message: '房间「{{roomName}}」状态从「{{oldStatus}}」变更为「{{newStatus}}」'
        }
      },
      system: {
        maintenance: {
          title: '系统维护通知',
          message: '系统将进行维护：{{info}}'
        }
      },
      password: {
        weakTitle: '密码安全提醒',
        weakContent: '您的密码强度较弱，为了您的账户安全，建议您及时更新密码。强密码应包含至少8个字符，并包含大写字母、小写字母、数字和特殊字符中的至少3类。'
      },
      errors: {
        fetchFail: '获取通知失败',
        unreadFail: '获取未读数量失败',
        markReadFail: '标记已读失败',
        markAllFail: '标记全部已读失败',
        deleteFail: '删除通知失败'
      },
      success: { markedRead: '已标记为已读', markedAllRead: '已全部标记为已读', deleted: '通知已删除' }
    },
    notificationBanner: {
      viewAll: '查看所有通知',
      dismiss: '关闭通知',
      clickToNavigate: '点击查看详情'
    },
    passwordSecurity: {
      weakPassword: {
        title: '密码安全提醒',
        content: '您当前使用的密码强度较弱，建议尽快前往个人资料页面修改为更安全的密码以保障账户安全。'
      }
    },
    notFound: {
      title: '404',
      subtitle: '哦豁，RoomX走丢了',
      backToHome: '返回首页',
      goBack: '返回上页'
    },
    login: {
      title: '登录',
      messages: {
        loginSuccess: '登录成功',
        registerSuccess: '注册成功！请使用新账号登录'
      },
      common: {
        default: '默认',
        system: '系统',
        browser: '浏览器偏好',
        refresh: '刷新',
        cancel: '取消',
        confirm: '确认',
        ok: '确定',
        create: '创建',
        submit: '提交',
        clearFilters: '清除筛选',
        loading: '加载中…',
        empty: '暂无数据'
      },
      register: '注册',
      switchToRegister: '立即注册',
      switchToLogin: '立即登录',
      subtitle: '更现代的教室预约管理',
      username: '用户名',
      password: '密码',
      confirmPassword: '确认密码',
      email: '邮箱',
      phone: '手机号',
      successNavigating: '登录成功！正在跳转...',
      errors: {
        accountKickout: '您的账号在其他地方登录，当前会话已失效',
        loginExpired: '登录已过期，请重新登录',
        loginUnauthorized: '登录状态异常，请重新登录',
        accountDeleted: '您的账户已被删除，请联系管理员',
        usernameRequired: '用户名必填!',
        usernameMinLength: '用户名至少3个字符!',
        usernamePattern: '用户名只能包含字母、数字和下划线!',
        passwordRequired: '密码必填!',
        emailRequired: '邮箱必填!',
        emailInvalid: '请输入有效的邮箱地址!',
        phoneRequired: '手机号必填!',
        phoneInvalid: '请输入有效的手机号!',
        passwordMinLength: '密码至少8个字符!',
        passwordComplexity: '除长度外至少满足任意2类: 大写/小写/数字/特殊',
        passwordConfirmRequired: '请确认密码!',
        passwordNotMatch: '两次输入的密码不一致!',
        loginFailed: '用户名或密码错误，请重试',
        networkError: '网络连接失败，请检查网络后重试',
        registerFailed: '注册失败，请检查输入信息'
      },
      prompts: {
        noAccount: '还没有账号？',
        hasAccount: '已有账号？',
        weakPasswordTitle: '密码强度提示',
        weakPasswordContent: '当前密码强度较弱，建议尽快前往个人中心修改为更安全的密码'
      }
    },
    settings: {
        title: '设置',
        language: '语言',
        theme: '主题',
        zhCN: '简体中文',
        enUS: 'English',
        font: '字体',
        fontIntro: '选择界面使用的主要字体渲染方式：',
        appleTitle: 'Apple 平台默认使用系统字体',
        appleDesc: '为提升渲染效果和一致性，Apple 设备默认选择系统字体。你仍可手动切换到 Inter（可能在部分 Safari 版本上存在渲染差异）。',
        tipLocal: '当前选择将保存在本地浏览器（localStorage），不会同步到服务器。切换后页面无需刷新即刻生效。',
        previewCurrent: '当前字体预览：',
        previewNumber: '数字 (lining + tabular)：'
    }
      
      
    
  },
  'en-US': {
    appName: 'RoomX',
    layout: {
      pleaseLogin: 'Please sign in',
      notifications: 'Notifications',
      themeLight: 'Light',
      themeDark: 'Dark',
      switchToLight: 'Switch to light mode',
      switchToDark: 'Switch to dark mode',
      defaultUser: 'User',
      csrf: {
        enabled: 'CSRF enabled with token present (XSRF-TOKEN)',
        noToken: 'CSRF enabled but no token detected, will auto-fetch before write operations',
        disabled: 'CSRF disabled'
      },
      menu: {
        navigation: 'Navigation Menu',
        dashboard: 'Dashboard',
        rooms: 'Rooms',
        applications: 'Applications',
        myApplications: 'My Applications',
        dutySchedule: 'Duty Schedule',
        users: 'Users',
        profile: 'Profile'
      },
      userMenu: {
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Sign out'
      }
    },
    common: {
      default: 'Default',
      system: 'System',
      browser: 'Browser',
      refresh: 'Refresh',
      cancel: 'Cancel',
      confirm: 'Confirm',
      ok: 'OK',
      create: 'Create',
      apply: 'Apply for...',
      save: 'Save',
      submit: 'Submit',
      clearFilters: 'Clear filters',
      loading: 'Loading…',
      empty: 'No data',
      reason: 'Reason'
    },
    modal: {
      confirm: {
        title: 'Confirm Operation',
        content: 'Are you sure you want to perform this operation?',
        okText: 'Confirm',
        cancelText: 'Cancel'
      },
      delete: {
        title: 'Confirm Deletion',
        content: 'This action cannot be undone. Are you sure you want to delete?',
        okText: 'Confirm Delete',
        cancelText: 'Cancel'
      },
      warning: {
        title: 'Warning',
        okText: 'I understand',
        cancelText: 'Cancel'
      },
      error: {
        title: 'Error',
        okText: 'OK'
      },
      info: {
        title: 'Information',
        okText: 'OK'
      }
    },
    lazy: {
      timeoutTitle: 'Load timed out',
      timeoutSubTitle: 'Component failed to load in time. Please retry or refresh the page.',
      retry: 'Retry',
      refreshPage: 'Refresh page'
    },
    notification: {
      title: 'Notifications',
      refresh: 'Refresh',
      markAllRead: 'Mark all read',
      loading: 'Loading…',
      empty: 'No notifications',
      localTag: 'Local',
      type: { system: 'System', application: 'Application', room: 'Room', user: 'User', security: 'Security', default: 'Notice' },
      priority: { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' },
      actions: { markRead: 'Mark as read', delete: 'Delete' },
      confirmDelete: { title: 'Delete this notification?', ok: 'OK', cancel: 'Cancel' },
      footer: { totalPrefix: '', totalSuffix: 'notifications', unreadSuffix: 'unread' },
      application: {
        approved: {
          title: 'Application Approved',
          message: 'Your application "{{title}}" has been approved. {{reason}}'
        },
        rejected: {
          title: 'Application Rejected',
          message: 'Your application "{{title}}" has been rejected. {{reason}}'
        }
      },
      room: {
        statusChange: {
          title: 'Room Status Changed',
          message: 'Room "{{roomName}}" status changed from "{{oldStatus}}" to "{{newStatus}}"'
        }
      },
      system: {
        maintenance: {
          title: 'System Maintenance Notice',
          message: 'System maintenance will be performed: {{info}}'
        }
      },
      errors: {
        fetchFail: 'Failed to fetch notifications',
        unreadFail: 'Failed to get unread count',
        markReadFail: 'Failed to mark as read',
        markAllFail: 'Failed to mark all as read',
        deleteFail: 'Failed to delete notification'
      },
      success: { markedRead: 'Marked as read', markedAllRead: 'All marked as read', deleted: 'Notification deleted' }
    },
    notificationBanner: {
      viewAll: 'View all notifications',
      dismiss: 'Dismiss notification',
      clickToNavigate: 'Click to view details'
    },
    passwordSecurity: {
      weakPassword: {
        title: 'Password Security Alert',
        content: 'Your current password strength is too weak. We recommend updating it to a stronger password in your profile page to ensure account security.'
      }
    },
    notFound: {
      title: '404',
      subtitle: 'Oops, RoomX got lost',
      backToHome: 'Back to Home',
      goBack: 'Go Back'
    },
    dashboard: {
      loadingStats: 'Loading statistics...',
      overviewTitle: 'Overview',
      stats: {
        totalRooms: 'Total Rooms',
        availableRooms: 'Available Rooms',
        myPending: 'My Pending',
        allPending: 'All Pending',
        onlineUsers: 'Online Users',
        pendingMaintenanceRooms: 'Pending Maintenance',
        maintenanceRooms: 'Under Maintenance',
        todayMaintenanceReports: 'Today\'s Repairs',
        pendingCleaningRooms: 'Pending Cleaning',
        cleaningRooms: 'Under Cleaning',
        todayCleaningReports: 'Today\'s Cleanings'
      },
      quickActionsTitle: 'Quick Actions',
      quickActions: {
        goToSettings: 'Go to Settings'
      },
      buttons: {
        applyRoom: 'Apply for Room',
        myApplications: 'My Applications',
        allApplications: 'All Applications',
        userManagement: 'User Management',
        roomManagement: 'Room Management'
      },
      latestNewsTitle: 'Latest Updates',
      latestNewsEmpty: 'No latest updates',
      fetchError: 'Failed to fetch statistics, please check network connection',
      todayDuty: {
        title: 'Today\'s Duty'
      }
    },
    login: {
      title: 'Sign in',
      messages: {
        loginSuccess: 'Login successful',
        registerSuccess: 'Registration successful! Please sign in with your new account'
      },
      common: {
        default: 'Default',
        system: 'System',
        browser: 'Browser Preference',
        refresh: 'Refresh',
        cancel: 'Cancel',
        confirm: 'Confirm',
        ok: 'OK',
        create: 'Create',
        submit: 'Submit',
        clearFilters: 'Clear Filters',
        loading: 'Loading…',
        empty: 'No Data'
      },
      register: 'Sign up',
      switchToRegister: 'Sign up',
      switchToLogin: 'Sign in',
      subtitle: 'Modern Classroom Reservation Management',
      username: 'Username',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      email: 'Email',
      phone: 'Phone',
      successNavigating: 'Login successful! Redirecting...',
      errors: {
        accountKickout: 'Your account has been logged in elsewhere, current session is expired',
        loginExpired: 'Login expired, please log in again',
        loginUnauthorized: 'Login status is abnormal, please log in again',
        accountDeleted: 'Your account has been deleted, please contact administrator',
        usernameRequired: 'Username is required!',
        usernameMinLength: 'Username must be at least 3 characters!',
        usernamePattern: 'Username can only contain letters, numbers & underscores!',
        passwordRequired: 'Password is required!',
        emailRequired: 'Email is required!',
        emailInvalid: 'Please enter a valid email address!',
        phoneRequired: 'Phone number is required!',
        phoneInvalid: 'Please enter a valid phone number!',
        passwordMinLength: 'Password must be at least 8 characters!',
        passwordComplexity: 'Must meet at least 2 types besides length: uppercase / lowercase / numbers / special',
        passwordConfirmRequired: 'Please confirm password!',
        passwordNotMatch: 'The two passwords entered are inconsistent!',
        loginFailed: 'Username or password is incorrect, please try again',
        networkError: 'Network connection failed, please check network and try again',
        registerFailed: 'Registration failed, please check input information',
        registerSuccess: 'Registration successful! Please log in with your new account'
      },
      prompts: {
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        weakPasswordTitle: 'Password Strength Alert',
        weakPasswordContent: 'Current password strength is weak, it is recommended to go to the personal center to change to a more secure password as soon as possible'
      }
    },
    roomList: {
      title: 'Rooms',
      searchPlaceholder: 'Search by room name',
      addRoom: 'New room',
      clearFilters: 'Clear filters',
      allTypes: 'All types',
      allStatuses: 'All statuses',
      paginationTotal: '{from}-{to} of {total} items',
      columns: {
        name: 'Room Name',
        type: 'Type',
        capacity: 'Capacity',
        status: 'Status',
        location: 'Location',
        actions: 'Actions'
      },
      tooltips: {
        viewDetail: 'View details',
        editRoom: 'Edit room',
        applyRoom: 'Apply',
        deleteRoom: 'Delete room',
        deleteRoomDisabled: 'Room in use, cannot delete'
      },
      form: {
        name: 'Room name',
        enterName: 'Enter room name',
        type: 'Room type',
        selectType: 'Select room type',
        capacity: 'Capacity',
        enterCapacity: 'Enter capacity',
        location: 'Location',
        enterLocation: 'Enter location',
        description: 'Description',
        enterDescription: 'Enter description',
        status: 'Room status',
        selectStatus: 'Select room status',
        timeRange: 'Usage time',
        selectTimeRange: 'Select usage time',
        timeRangePlaceholder: {
          0: 'Start time',
          1: 'End time'
        },
        reason: 'Purpose',
        enterReason: 'Describe the purpose',
        crowd: 'Participants',
        enterCrowd: 'Enter participant count',
        contact: 'Contact',
        enterContact: 'Enter contact info',
        remark: 'Remark',
        enterRemark: 'Enter remark'
      },
      error: {
        fetchListFail: 'Failed to load rooms. Check your connection.',
        dataFetchTitle: 'Failed to load data'
      },
      drawer: {
        add: 'New Room',
        edit: 'Edit Room',
        detail: 'Room Details',
        apply: 'Apply for Room'
  },
      detail: {
        futureApprovedTitle: 'Future approved bookings',
        noneFuture: 'No upcoming bookings'
      },
      messages: {
        addSuccess: 'Room created',
        addFail: 'Failed to create room',
        editSuccess: 'Room updated',
        editFail: 'Failed to update room',
        deleteSuccess: 'Room deleted',
        deleteFail: 'Failed to delete room',
        applySuccess: 'Submitted. Redirecting to applications…',
        applySuccessBrief: 'Submitted',
        applyFail: 'Submit failed',
  operationFailed: 'Operation failed, please retry'
      },
      errors: {
        delete: {
          relatedApplications: 'Delete failed: related applications exist. Please resolve them first.',
          inUse: 'Delete failed: room is in use.',
          notExists: 'Delete failed: room not found or already deleted.',
          unknownPrefix: 'Delete room failed: '
        },
  fetchRoomDetailFail: 'Failed to fetch room details',
        fetchListFail: 'Failed to load rooms. Check your connection.',
        dataFetchTitle: 'Failed to load data'
      },
      labels: {
        people: '',
        name: 'Name',
        type: 'Type',
        capacity: 'Capacity',
        location: 'Location',
        status: 'Status',
        description: 'Description',
        none: 'N/A',
        roomLocation: 'Location',
        roomCapacity: 'Capacity',
        currentStatus: 'Current status'
      },
      options: {
        types: {
          caseroom: 'Case room',
          seminar: 'Seminar',
          lab: 'Lab',
          lecture: 'Lecture room',
          other: 'Other'
        },
        statuses: {
          available: 'Available',
          reserved: 'Reserved',
          using: 'In use',
          maintenance: 'Maintenance',
          cleaning: 'Cleaning',
          pending_cleaning: 'Pending cleaning',
          pending_maintenance: 'Pending maintenance',
          unavailable: 'Unavailable'
        }
      },
      modals: {
        confirmDeleteTitle: 'Confirm Room Deletion',
        confirmDeleteQuestion: 'Are you sure you want to delete the following room?',
        warnIrreversible: '⚠️ Warning: This action is irreversible. Deleting the room will also delete all related application records.',
        confirmDeleteOk: 'Confirm Delete',
        cancel: 'Cancel',
        confirmUpdateTitle: 'Confirm Room Information Update',
        confirmUpdateTip: 'Are you sure you want to update room information? Updates may affect ongoing operations. Please proceed with caution.',
        changesTitle: 'Changes:',
        confirmUpdateOk: 'Confirm Update'
      },
  deleteInUseWarning: 'Room is in use or reserved and cannot be deleted.',
  timeConflict: 'Selected time conflicts with existing bookings. Please choose another.'
    },
    room: {
      status: {
        AVAILABLE: 'Available',
        RESERVED: 'Reserved',
        USING: 'In use',
        MAINTENANCE: 'Maintenance',
        CLEANING: 'Cleaning',
        PENDING_CLEANING: 'Pending cleaning',
        PENDING_MAINTENANCE: 'Pending maintenance',
        UNAVAILABLE: 'Unavailable'
      },
      type: {
        CASE_ROOM: 'Case room',
        SEMINAR_ROOM: 'Seminar',
        LAB_ROOM: 'Lab',
        LECTURE_ROOM: 'Lecture room',
        OTHER_ROOM: 'Other',
        UNKNOWN: 'Unknown'
      }
    },
    user: {
      role: {
        ADMIN: 'Admin',
        APPROVER: 'Approver',
        APPLIER: 'Applicant',
        SERVICE: 'Service',
        MAINTAINER: 'Maintainer',
        USER: 'User',
        DEFAULT: 'User'
      },
      permission: {
        READ_ONLY: 'Read-only',
        RESTRICTED: 'Restricted',
        NORMAL: 'Normal',
        EXTENDED: 'Extended',
        UNSET: 'Unset'
      },
      common: {
        notSet: 'Not set',
        passwordMin8: 'At least 8 characters',
        passwordRule: 'Besides length, satisfy any 2 of: upper/lowercase/digit/special',
        enterValidEmail: 'Please enter a valid email address'
      }
    },
    passwordStrength: {
      title: 'Password Strength',
      length: 'Length≥8',
      uppercase: 'Uppercase',
      lowercase: 'Lowercase',
      number: 'Number',
      special: 'Special',
      weak: 'Weak',
      medium: 'Medium',
      strong: 'Strong',
      satisfied: 'Satisfied',
      missing: 'Missing',
      none: 'None',
      sufficient: 'Basic security requirements met',
      requirements: 'Need length≥8 and any 2 more types'
    },
    userList: {
      title: 'User Management',
      createUser: 'Create User',
      noDeletePermission: 'No delete permission',
      allRoles: 'All roles',
      paginationTotal: '{from}-{to} of {total} items',
      filters: {
        searchUsername: 'Search username',
        searchNickname: 'Search nickname'
      },
      columns: {
        username: 'Username',
        nickname: 'Nickname',
        role: 'Role',
        email: 'Email',
        phone: 'Phone',
        createTime: 'Registered at',
        lastLoginTime: 'Last login',
        actions: 'Actions'
      },
      tooltips: {
        viewDetail: 'View details',
        editUser: 'Edit user',
        deleteUser: 'Delete user'
      },
      drawer: {
        detail: 'User Details',
        edit: 'Edit User',
        create: 'Create User'
      },
      labels: {
        displayName: 'Display name',
        username: 'Username',
        nickname: 'Nickname',
        role: 'Role',
        email: 'Email',
        phone: 'Phone',
        createTime: 'Registered at',
        lastLoginTime: 'Last login',
        department: 'Department',
        serviceArea: 'Service area',
        permission: 'Approval permission',
        skill: 'Skill scope'
      },
      form: {
        username: 'Username',
        enterUsername: 'Enter username',
        password: 'Password',
        enterPassword: 'Enter password',
        role: 'Role',
        selectRole: 'Select a role',
        nickname: 'Nickname',
        enterNickname: 'Enter nickname',
        email: 'Email',
        enterEmail: 'Enter email',
        phone: 'Phone',
        enterPhone: 'Enter phone',
        department: 'Department',
        enterDepartment: 'Enter department',
        permission: 'Approval permission',
        selectPermission: 'Select permission',
        serviceArea: 'Service area',
        enterServiceArea: 'Enter service area',
        skill: 'Skill scope',
        enterSkill: 'Enter skill scope'
      },
      messages: {
        deleteSuccess: 'User deleted',
        deleteFailPrefix: 'Delete user failed: ',
        selfDeleteLogout: 'You have deleted your own account and will be logged out shortly',
        createSuccess: 'User created',
        createFail: 'Failed to create user',
        updateSuccess: 'User updated',
        updateFail: 'Failed to update user'
      },
      errors: {
        dataFetchTitle: 'Failed to load data'
      },
      auth: {
        tokenExpired: 'Session expired, please sign in again',
        forbidden: 'Insufficient permission; admin required',
        result403Subtitle: 'Sorry, you are not authorized to view this page.',
        result403RolePrefix: 'Current role: ',
        result403NeedRole: 'User view permission is required to access user management.',
        resultErrorTitle: 'Access failed'
      },
      confirmDelete: {
        title: 'Confirm delete',
        content: 'Delete user "{username}"? This is a irreversible and very dangerous action! The deleted user will be logged out immediately.',
        nextStep: 'Continue'
      },
      confirmDeleteSelf: {
        title: 'Warning: Deleting Your Own Account',
        warning: 'You are attempting to delete your own admin account!',
        consequence: 'You will be immediately logged out after deletion, and this action cannot be undone.',
        confirm: 'Are you sure you want to continue?',
        continueText: 'Continue'
      },
      secondConfirm: {
        passwordTitle: 'Enter Password to Confirm',
        usernameTitle: 'Enter Username to Confirm',
        passwordPrompt: 'To confirm deleting your own account, please enter your password:',
        usernamePrompt: 'To confirm deleting user "{username}", please enter the username:',
        enterPassword: 'Enter password',
        enterUsername: 'Enter username',
        confirmDelete: 'Confirm Delete',
        passwordRequired: 'Password is required',
        passwordIncorrect: 'Password is incorrect',
        usernameIncorrect: 'Username is incorrect'
      }
    },
    userProfile: {
      loading: 'Loading...',
      userNotFound: 'User not found',
      cards: {
        basic: {
          title: 'Basic Info',
          id: 'ID',
          username: 'Username',
          role: 'Role'
        },
        profile: {
          title: 'Profile',
          edit: 'Edit',
          save: 'Save',
          cancel: 'Cancel',
          changePassword: 'Change Password',
          labels: {
            nickname: 'Nickname',
            email: 'Email',
            phone: 'Phone'
          }
        },
        activities: {
          title: 'Recent Activities',
          refresh: 'Refresh',
          empty: 'No recent activity'
        }
      },
      form: {
        nickname: 'Nickname',
        enterNickname: 'Enter nickname',
        email: 'Email',
        enterEmail: 'Enter email',
        phone: 'Phone',
        enterPhone: 'Enter phone',
        department: 'Department',
        enterDepartment: 'Enter department',
        permission: 'Approval permission',
        selectPermission: 'Select permission',
        serviceArea: 'Service area',
        enterServiceArea: 'Enter service area',
        skill: 'Skill scope',
        enterSkill: 'Enter skill scope'
      },
      roleInfo: {
        department: 'Department',
        permission: 'Approval permission',
        serviceArea: 'Service area',
        skill: 'Skill scope'
      },
      messages: {
        updateSuccess: 'User updated',
        updateFail: 'Failed to update user',
        passwordChangeSuccess: 'Password changed',
        passwordChangeFail: 'Failed to change password'
      },
      passwordModal: {
        title: 'Change Password',
        okText: 'Confirm',
        cancelText: 'Cancel',
        fields: {
          oldPassword: 'Current password',
          enterOldPassword: 'Enter current password',
          newPassword: 'New password',
          enterNewPassword: 'Enter new password',
          confirmPassword: 'Confirm new password',
          enterConfirmPassword: 'Confirm the new password',
          notMatch: 'Passwords do not match'
        }
      }
    },
    myApplications: {
      title: 'My Applications',
      filters: {
        all: 'All',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        cancelled: 'Cancelled'
      },
      actions: {
        cancel: 'Cancel Application',
        checkin: 'Check In',
        details: 'View Details',
        edit: 'Edit',
        checkinConfirmTitle: 'Confirm Check In',
        checkinConfirmContent: 'Confirm check in for this application? This action cannot be undone.',
        checkinConfirmOk: 'Confirm Check In',
        checkinSuccess: 'Check in successful',
        checkinFail: 'Check in failed',
        cancelConfirmTitle: 'Confirm Cancel Application',
        cancelConfirmContent: 'Are you sure you want to cancel this application? This action cannot be undone.',
        cancelConfirmContentApproved: 'This application has been approved. Canceling will release the room reservation. Are you sure?',
        cancelConfirmContentPendingCheckin: 'This application is waiting for check-in. Canceling will release the room reservation. Are you sure?',
        cancelConfirmContentInUse: 'This application is currently in use. Canceling will mark it as completed. Are you sure?',
        cancelConfirmOk: 'Confirm Cancel',
        cancelSuccess: 'Application cancelled',
        cancelFail: 'Failed to cancel application'
      },
      columns: {
        roomName: 'Room Name',
        usageTime: 'Usage Time',
        status: 'Status',
        submitTime: 'Submit Time',
        reason: 'Reason',
        actions: 'Actions'
      },
      status: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        cancelled: 'Cancelled',
        checkedIn: 'Checked In'
      }
    },
    applicationManagement: {
      title: 'Applications',
      badgeRetention: 'Records kept up to 60 days after expiry',
      filters: {
        roomSearchPlaceholder: 'Search room name',
        applicantSearchPlaceholder: 'Search applicant',
        statusPlaceholder: 'All statuses',
        datePlaceholder: 'Select date',
        showExpired: 'Show expired applications',
        clearFilters: 'Clear filters'
      },
      statusOptions: {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        REJECTED: 'Rejected',
        CANCELLED: 'Cancelled',
        COMPLETED: 'Completed',
        EXPIRED: 'Expired',
        PENDING_CHECKIN: 'Pending Check-in',
        IN_USE: 'In Use'
      },
      error: {
        fetchListFail: 'Failed to load applications. Please check your connection.',
        dataFetchTitle: 'Failed to load data'
      },
      auth: {
        tokenExpired: 'Session expired, please sign in again',
        forbidden: 'Insufficient permission; approver or admin required',
        result403Subtitle: 'Sorry, you are not authorized to view this page.',
        result403RolePrefix: 'Current role: ',
        result403NeedRole: 'Approver or admin required to access Applications.',
        resultErrorTitle: 'Access failed'
      },
      messages: {
        cancelConfirmContent: 'Are you sure you want to cancel this application?',
        cancelConfirmContentApproved: 'Are you sure you want to cancel this approved application? The room booking will be canceled.',
        cancelConfirmContentPendingCheckin: 'Are you sure you want to cancel this application? Your check-in appointment will be canceled.',
        cancelConfirmContentInUse: 'Cannot cancel application that is currently in use.',
        cancelConfirmTitle: 'Confirm Cancel',
        cancelConfirmOk: 'Cancel Application',
        cancelConfirmCancel: 'Keep Application',
        approveApproved: 'Application approved',
        approveRejected: 'Application rejected',
        approveFail: 'Approval failed',
        approveSuccess: 'Approval succeeded',
        cancelSuccess: 'Application cancelled',
        cancelFail: 'Cancel failed'
      },
      actions: {
        back: 'Back',
        login: 'Sign in',
        checkin: 'Check In',
        checkinSuccess: 'Check in successful',
        checkinFail: 'Check in failed',
        checkinConfirmTitle: 'Confirm Check In',
        checkinConfirmContent: 'Are you sure you want to check in for this application? This action cannot be undone.',
        checkinConfirmOk: 'Confirm Check In',
        checkinConfirmCancel: 'Cancel'
      },
      columns: {
        roomName: 'Room',
        applicant: 'Applicant',
        status: 'Status',
        usageTime: 'Time',
        reason: 'Purpose',
        createTime: 'Submitted at',
        actions: 'Actions'
      },
      tooltips: {
        viewDetail: 'View details',
        approve: 'Approve',
        cancel: 'Cancel'
      },
      drawer: {
        detail: 'Application Details',
        approve: 'Approve Application',
        cancel: 'Cancel Application'
      },
      descriptions: {
        applicant: 'Applicant',
        roomName: 'Room',
        startTime: 'Start time',
        endTime: 'End time',
        status: 'Status',
        createTime: 'Submitted at',
        reason: 'Note',
        time: 'Time'
      },
      form: {
        approveResult: 'Decision',
        pleaseSelectApproveResult: 'Please select a decision',
        approveOptionApprove: 'Approve',
        approveOptionReject: 'Reject',
        approveOpinion: 'Review comment',
        cancelReason: 'Cancel reason',
        enterApproveOpinion: 'Please enter review comment',
        enterCancelReason: 'Please enter cancel reason',
        selectTime: 'Select usage time',
        selectRoom: 'Select room',
        timeRangePlaceholder: {
          0: 'Start time',
          1: 'End time'
        }
      },
      paginationTotal: '{from}-{to} of {total} items'
    },
    dutySchedule: {
      title: 'Duty Schedule',
      messages: {
        fetchFail: 'Failed to fetch duty schedules',
        createSuccess: 'Created successfully',
        updateSuccess: 'Updated successfully',
        deleteSuccess: 'Deleted successfully',
        deleteFail: 'Delete failed',
        submitFail: 'Submit failed'
      },
      columns: {
        dutyDate: 'Duty Date',
        dutyUser: 'Duty Personnel',
        remark: 'Remark',
        createdBy: 'Created By',
        createTime: 'Created At',
        actions: 'Actions'
      },
      tooltips: {
        edit: 'Edit',
        delete: 'Delete'
      },
      buttons: {
        create: 'New Duty Schedule'
      },
      confirmDelete: {
        title: 'Confirm Delete',
        content: 'Are you sure you want to delete this duty schedule? This action cannot be undone.'
      },
      drawer: {
        create: 'New Duty Schedule',
        edit: 'Edit Duty Schedule'
      },
      monthPicker: {
        placeholder: 'Select Month'
      },
      form: {
        dutyDate: 'Duty Date',
        selectDate: 'Please select duty date',
        dutyUser: 'Duty Personnel',
        selectUser: 'Please select duty personnel',
        remark: 'Remark',
        enterRemark: 'Please enter remark'
      },
      todayDuty: {
        title: 'Today\'s Duty',
        noDuty: 'No one on duty today'
      },
      calendar: {
        adminHint: 'Click calendar cells to add or edit duty schedules',
        userHint: 'View duty schedules'
      },
      paginationTotal: '{from}-{to} of {total} items'
    },
    feedback: {
      buttonText: 'Feedback',
      buttonHint: 'Click to provide feedback if you have any issues or suggestions',
      todayDutyTitle: 'You can contact today\'s Duty',
      noDutyToday: 'No one on duty today, you can write feedback directly, we will forward it later to the relevant personnel.',
      modalTitle: 'Feedback',
      submitSuccess: 'Feedback submitted successfully. Thank you for your suggestion!',
      submitFail: 'Submit failed, please try again later',
      submit: 'Submit Feedback',
      form: {
        type: 'Feedback Type',
        selectType: 'Please select feedback type',
        title: 'Feedback Title',
        enterTitle: 'Please enter feedback title',
        titleTooLong: 'Title cannot exceed 50 characters',
        content: 'Feedback Content',
        enterContent: 'Please describe your issue or suggestion in detail...',
        contentTooShort: 'Feedback content must be at least 10 characters',
        contentTooLong: 'Feedback content cannot exceed 500 characters',
        contact: 'Contact Info (Optional)',
        enterContact: 'Please enter email or phone number'
      },
      types: {
        bug: 'Bug Report',
        suggestion: 'Feature Suggestion',
        complaint: 'Service Complaint',
        other: 'Other'
      }
    },
    applicationStatus: {
      title: 'Status Monitor',
      subtitle: 'Monitor application statuses and auto-handle expiry',
      expiringTitle: 'Expiring soon (within 15 minutes)',
      columns: {
        id: 'ID'
      },
      actions: {
        updateStatus: 'Update status',
        updateAll: 'Update all'
      },
      messages: {
        updateAllSuccess: 'All statuses updated',
        updateAllFail: 'Failed to update statuses',
        updateOneSuccess: 'Status updated',
        updateOneFail: 'Failed to update status'
      },
      errors: {
        fetchStatsFail: 'Failed to fetch status stats',
        fetchExpiringFail: 'Failed to fetch expiring applications'
      },
      rulesTitle: 'Auto Update Rules',
      rules: {
        expirationTitle: 'Expiration rules:',
        expiration: {
          items: {
            item1: '15 minutes past scheduled start: auto expire',
            item2: '24 hours after end: mark as expired'
          }
        },
        frequencyTitle: 'Update frequency:',
        frequency: {
          items: {
            item1: 'Applications: check every 5 minutes',
            item2: 'Rooms: check every 1 minute'
          }
        },
        manualTitle: 'Manual operations:',
        manual: {
          items: {
            item1: 'Click "Update all" to refresh all application statuses now',
            item2: 'Click "Update status" to refresh a single application'
          }
        }
      }
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      zhCN: '简体中文',
      enUS: 'English',
      font: 'Font Rendering',
      fontIntro: 'Choose the primary font rendering for the UI:',
      appleTitle: 'Apple devices prefer system font by default',
      appleDesc: 'For better rendering consistency, Apple devices default to system font. You can still switch to Inter (some Safari versions may render slightly different).',
      tipLocal: 'Your choice is saved at localStorage and takes effect immediately without page reload.',
      previewCurrent: 'Preview:',
      previewNumber: 'Numbers (lining + tabular):'
    }
  }
};

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('zh-CN');
  useEffect(() => {
  try {
      const saved = localStorage.getItem(I18N_LANG_KEY);
      if (saved) setLangState(saved);
    } catch(_) {}
  }, []);

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem(I18N_LANG_KEY, l); } catch(_) {}
  };

  const t = useMemo(() => {
    const dict = dictionaries[lang] || dictionaries['zh-CN'];
    return (key, fallback) => {
      const parts = key.split('.');
      let cur = dict;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
        else { cur = undefined; break; }
      }
      return (typeof cur === 'string') ? cur : (fallback ?? key);
    };
  }, [lang]);

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// Global translator for use outside React components/hooks (e.g., utils)
export function tGlobal(key, fallback) {
  let lang = 'zh-CN';
  try {
    const saved = localStorage.getItem(I18N_LANG_KEY);
    if (saved) lang = saved;
  } catch (_) {}

  const dict = dictionaries[lang] || dictionaries['zh-CN'];
  const parts = key.split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else { cur = undefined; break; }
  }
  return (typeof cur === 'string') ? cur : (fallback ?? key);
}
