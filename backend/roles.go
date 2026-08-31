package main

import "strings"

// Konstanta role sistem analitik kesejahteraan mahasiswa UMCI.
// student    = mahasiswa pengguna utama
// dpa        = dosen pembimbing akademik (admin biasa, scope mahasiswa bimbingan)
// superadmin = kaprodi (akses administratif + analytics tingkat prodi)
const (
	RoleStudent    = "student"
	RoleDPA        = "dpa"
	RoleSuperadmin = "superadmin"
)

func normalizeRole(role string) string {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case RoleDPA:
		return RoleDPA
	case RoleSuperadmin:
		return RoleSuperadmin
	default:
		return RoleStudent
	}
}

func isValidRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case RoleStudent, RoleDPA, RoleSuperadmin:
		return true
	}
	return false
}

func isStudentRole(role string) bool {
	return normalizeRole(role) == RoleStudent
}

func isDpaRole(role string) bool {
	return normalizeRole(role) == RoleDPA
}

func isSuperadminRole(role string) bool {
	return normalizeRole(role) == RoleSuperadmin
}

// isAdminLevelRole mencakup dpa dan superadmin: bukan responden asesmen.
func isAdminLevelRole(role string) bool {
	return !isStudentRole(role)
}
