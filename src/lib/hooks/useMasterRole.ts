import { useState, useEffect } from 'react';
import { AppRoleService } from '@/lib/services/approle.service';
import { useAuth } from '@/lib/hooks/useAuth';

export const useMasterRole = () => {
    const [isMaster, setIsMaster] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user, token } = useAuth();

    useEffect(() => {
        const checkMasterRole = async () => {
            if (!user || !token) {
                setIsMaster(false);
                setLoading(false);
                return;
            }

            try {
                const hasMaster = await AppRoleService.hasMasterRole(user.id, token);
                setIsMaster(hasMaster);
            } catch (error) {
                console.error('Error checking master role:', error);
                setIsMaster(false);
            } finally {
                setLoading(false);
            }
        };

        checkMasterRole();
    }, [user, token]);

    return { isMaster, loading };
}; 