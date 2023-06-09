const userService = require('../service/user.service')
const {throwKoaException} = require('../exception/exception-kit')
const exceptionType = require('../exception/exception-type')

const validateUserCreateRequest = async (ctx, next) => {
    const {username = '', email = '', password = ''} = ctx.request.body

    if (!email.trim() || !password.trim()) {
        return throwKoaException(exceptionType.FORM_EMPTY, ctx)
    }

    if (username.length > 255 || password.length > 255 || email.length > 255) {
        return throwKoaException(exceptionType.TEXT_TO_LONG, ctx)
    }

    const regular = /^[a-z,A-Z,0-9]+@[a-z,A-Z]+.[a-z,A-Z]+$/
    if (!email.match(regular)) {
        return throwKoaException(exceptionType.EMAIL_FORMAT_ERROR, ctx)
    }

    let role = false
    const USER_TOKEN = ctx['USER_TOKEN']
    const userCount = await userService.count()
    if (userCount === 0) {
        role = true
    } else {
        if (USER_TOKEN === null) {
            return throwKoaException(exceptionType.TOKEN_INVALID, ctx)
        }
        if (!USER_TOKEN['role']) {
            return throwKoaException(exceptionType.PERMISSION_DENIED, ctx)
        }
    }

    const result = await userService.findOneByEmail(email)
    if (result !== null) {
        return throwKoaException(exceptionType.EMAIL_EXIST, ctx)
    }

    ctx.userCreateRequest = {
        username,
        email,
        password,
        role
    }

    await next()
}

const validateUserUpdateRequest = async (ctx, next) => {
    const USER_TOKEN = ctx['USER_TOKEN']
    if (USER_TOKEN === null) {
        return throwKoaException(exceptionType.TOKEN_INVALID, ctx)
    }

    const {username, bio} = ctx.request.body

    const userUpdateRequest = {}

    if (typeof (username) !== 'undefined') {
        if (username.length > 255) {
            return throwKoaException(exceptionType.TEXT_TO_LONG, ctx)
        }
        userUpdateRequest.username = username
    }

    if (typeof (bio) !== 'undefined') {
        if (bio.length > 255) {
            return throwKoaException(exceptionType.TEXT_TO_LONG, ctx)
        }
        userUpdateRequest.bio = bio
    }

    ctx.userUpdateRequest = userUpdateRequest

    await next()
}

const validateUserRemoveRequest = async (ctx, next) => {
    const USER_TOKEN = ctx['USER_TOKEN']
    if (USER_TOKEN === null) {
        return throwKoaException(exceptionType.TOKEN_INVALID, ctx)
    }

    const {uuid} = ctx.params

    if (!USER_TOKEN['role']) {
        return throwKoaException(exceptionType.PERMISSION_DENIED, ctx)
    }

    if (USER_TOKEN['uuid'] === uuid) {
        return throwKoaException(exceptionType.PERMISSION_DENIED, ctx)
    }

    const result = await userService.findOneByUUID(uuid)
    if (result === null) {
        return throwKoaException(exceptionType.USER_NOT_FOUND, ctx)
    }

    await next()
}

const validateUserDetailRequest = async (ctx, next) => {
    const USER_TOKEN = ctx['USER_TOKEN']
    let {uuid = ''} = ctx.params

    if (!uuid || !uuid.trim()) {
        if (USER_TOKEN === null) {
            return throwKoaException(exceptionType.PARAMETER_ERROR, ctx)
        }
        uuid = USER_TOKEN['uuid']
    }

    ctx.userDetailRequest = {
        uuid
    }

    await next()
}

module.exports = {
    validateUserCreateRequest,
    validateUserUpdateRequest,
    validateUserRemoveRequest,
    validateUserDetailRequest
}